PRAGMA foreign_keys = ON;

-- PK LASER AI Brain: canonical observations, causal graph, diagnosis runs and learning feedback.

CREATE TABLE IF NOT EXISTS ai_signals (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  data_type TEXT NOT NULL DEFAULT 'boolean' CHECK (data_type IN ('boolean','number','text','enum')),
  unit TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_causes (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  subsystem TEXT NOT NULL,
  description TEXT,
  base_prior REAL NOT NULL DEFAULT 0.10 CHECK (base_prior >= 0 AND base_prior <= 1),
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low','medium','high','critical')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_causal_edges (
  signal_code TEXT NOT NULL,
  cause_code TEXT NOT NULL,
  weight REAL NOT NULL CHECK (weight >= -1 AND weight <= 1),
  rationale TEXT,
  source_type TEXT NOT NULL DEFAULT 'expert' CHECK (source_type IN ('expert','manual','case','learned')),
  sample_count INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (signal_code, cause_code),
  FOREIGN KEY (signal_code) REFERENCES ai_signals(code) ON DELETE CASCADE,
  FOREIGN KEY (cause_code) REFERENCES ai_causes(code) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ai_tests (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  subsystem TEXT NOT NULL,
  instructions TEXT NOT NULL,
  cost_score REAL NOT NULL DEFAULT 1,
  risk_score REAL NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_cause_tests (
  cause_code TEXT NOT NULL,
  test_code TEXT NOT NULL,
  information_gain REAL NOT NULL DEFAULT 0.5 CHECK (information_gain >= 0 AND information_gain <= 1),
  expected_if_true TEXT,
  PRIMARY KEY (cause_code, test_code),
  FOREIGN KEY (cause_code) REFERENCES ai_causes(code) ON DELETE CASCADE,
  FOREIGN KEY (test_code) REFERENCES ai_tests(code) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ai_diagnostic_runs (
  id TEXT PRIMARY KEY,
  machine_id TEXT,
  ticket_id TEXT,
  requested_by TEXT NOT NULL,
  evidence_json TEXT NOT NULL,
  result_json TEXT NOT NULL,
  top_cause_code TEXT,
  top_confidence REAL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (machine_id) REFERENCES machines(id) ON DELETE SET NULL,
  FOREIGN KEY (ticket_id) REFERENCES service_tickets(id) ON DELETE SET NULL,
  FOREIGN KEY (requested_by) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY (top_cause_code) REFERENCES ai_causes(code) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_ai_runs_machine ON ai_diagnostic_runs(machine_id);
CREATE INDEX IF NOT EXISTS idx_ai_runs_ticket ON ai_diagnostic_runs(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ai_runs_created_at ON ai_diagnostic_runs(created_at);

CREATE TABLE IF NOT EXISTS ai_feedback (
  id TEXT PRIMARY KEY,
  diagnostic_run_id TEXT NOT NULL,
  confirmed_cause_code TEXT,
  outcome TEXT NOT NULL CHECK (outcome IN ('confirmed','rejected','partially_confirmed','unknown')),
  action_taken TEXT,
  resolution_note TEXT,
  submitted_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (diagnostic_run_id) REFERENCES ai_diagnostic_runs(id) ON DELETE CASCADE,
  FOREIGN KEY (confirmed_cause_code) REFERENCES ai_causes(code) ON DELETE SET NULL,
  FOREIGN KEY (submitted_by) REFERENCES users(id) ON DELETE RESTRICT
);

INSERT OR IGNORE INTO ai_signals(code,name,category,description) VALUES
('CUT_NOT_THROUGH','Cắt không đứt','cutting','Vật liệu không được cắt xuyên hoàn toàn'),
('WEAK_BEAM','Tia yếu','laser','Năng lượng laser thực tế thấp hơn kỳ vọng'),
('UNSTABLE_BEAM','Tia không ổn định','laser','Công suất hoặc chất lượng tia dao động'),
('HEAVY_DROSS','Xỉ nhiều','cutting','Xỉ bám nhiều ở mặt dưới đường cắt'),
('FOCUS_DRIFT','Focus bị lệch','optics','Điểm focus thay đổi so với giá trị chuẩn'),
('PRESSURE_LOW','Áp suất khí thấp','gas','Áp suất khí cắt thấp hơn yêu cầu'),
('NOZZLE_MISALIGN','Béc lệch tâm','optics','Tia không đồng tâm với béc'),
('PROTECTIVE_LENS_DIRTY','Kính bảo vệ bẩn/cháy','optics','Kính bảo vệ nhiễm bẩn hoặc hư hỏng'),
('SERVO_ALARM','Servo báo lỗi','motion','Có alarm từ driver hoặc servo'),
('POSITION_ERROR','Sai số vị trí','motion','Sai lệch vị trí hoặc kích thước gia công');

INSERT OR IGNORE INTO ai_causes(code,name,subsystem,description,base_prior,severity) VALUES
('OPTICAL_CONTAMINATION','Nhiễm bẩn quang học','optics','Kính bảo vệ hoặc đường quang bị bẩn/cháy làm suy hao năng lượng',0.18,'high'),
('FOCUS_OFFSET','Sai lệch focus','optics','Focus thực tế không đúng vị trí tối ưu',0.16,'high'),
('NOZZLE_ALIGNMENT','Béc/đường tia lệch tâm','optics','Béc hoặc chùm tia không đồng tâm',0.10,'medium'),
('GAS_DELIVERY','Khí cắt không đủ','gas','Áp suất/lưu lượng/chất lượng khí cắt không đạt',0.14,'high'),
('LASER_SOURCE_OUTPUT','Nguồn laser suy giảm công suất','laser','Nguồn laser phát công suất thấp hoặc không ổn định',0.12,'critical'),
('CONTROL_SIGNAL_INSTABILITY','Tín hiệu điều khiển không ổn định','control','Tín hiệu công suất/enable/feedback bị nhiễu hoặc sai',0.08,'high'),
('SERVO_DRIVE_FAULT','Lỗi servo/driver','motion','Driver, encoder hoặc motor servo phát sinh lỗi',0.11,'high'),
('MECHANICAL_BACKLASH','Độ rơ cơ khí','motion','Hộp số, bánh răng, thanh răng hoặc liên kết có độ rơ',0.07,'medium');

INSERT OR IGNORE INTO ai_causal_edges(signal_code,cause_code,weight,rationale) VALUES
('CUT_NOT_THROUGH','OPTICAL_CONTAMINATION',0.75,'Suy hao quang học làm giảm năng lượng tại phôi'),
('CUT_NOT_THROUGH','FOCUS_OFFSET',0.85,'Focus sai làm mật độ công suất không đạt'),
('CUT_NOT_THROUGH','GAS_DELIVERY',0.70,'Khí cắt yếu làm khó thổi vật liệu nóng chảy'),
('CUT_NOT_THROUGH','LASER_SOURCE_OUTPUT',0.82,'Công suất nguồn thực tế thấp gây cắt không xuyên'),
('WEAK_BEAM','OPTICAL_CONTAMINATION',0.70,'Quang học bẩn thường biểu hiện như tia yếu'),
('WEAK_BEAM','LASER_SOURCE_OUTPUT',0.90,'Công suất nguồn thấp là nguyên nhân trực tiếp'),
('UNSTABLE_BEAM','LASER_SOURCE_OUTPUT',0.82,'Nguồn không ổn định làm công suất dao động'),
('UNSTABLE_BEAM','CONTROL_SIGNAL_INSTABILITY',0.78,'Tín hiệu điều khiển không ổn định gây dao động công suất'),
('HEAVY_DROSS','FOCUS_OFFSET',0.66,'Focus không tối ưu làm tăng xỉ'),
('HEAVY_DROSS','GAS_DELIVERY',0.80,'Khí không đủ làm xỉ bám nhiều'),
('FOCUS_DRIFT','FOCUS_OFFSET',0.95,'Triệu chứng liên quan trực tiếp tới sai focus'),
('PRESSURE_LOW','GAS_DELIVERY',0.95,'Áp suất thấp xác nhận nhánh khí cắt'),
('NOZZLE_MISALIGN','NOZZLE_ALIGNMENT',0.98,'Quan sát lệch tâm xác nhận nhánh béc/đường tia'),
('PROTECTIVE_LENS_DIRTY','OPTICAL_CONTAMINATION',0.98,'Kính bẩn/cháy là bằng chứng trực tiếp'),
('SERVO_ALARM','SERVO_DRIVE_FAULT',0.95,'Alarm servo ưu tiên nhánh driver/encoder/motor'),
('POSITION_ERROR','SERVO_DRIVE_FAULT',0.60,'Sai số vị trí có thể do servo'),
('POSITION_ERROR','MECHANICAL_BACKLASH',0.78,'Độ rơ cơ khí gây sai số vị trí lặp lại');

INSERT OR IGNORE INTO ai_tests(code,name,subsystem,instructions,cost_score,risk_score) VALUES
('CHECK_PROTECTIVE_LENS','Kiểm tra kính bảo vệ','optics','Tháo và kiểm tra kính dưới ánh sáng sạch; tìm cháy, mờ, bụi hoặc vết dầu. Không chạm tay trực tiếp lên bề mặt.',1,1),
('CHECK_FOCUS_REFERENCE','Kiểm tra focus chuẩn','optics','So sánh focus thực tế với thông số chuẩn theo vật liệu; thực hiện test focus sweep nếu quy trình máy cho phép.',2,1),
('CHECK_NOZZLE_CENTER','Kiểm tra đồng tâm béc','optics','Thực hiện test đồng tâm tia-béc theo quy trình đầu cắt và xác nhận lỗ béc không biến dạng.',1,1),
('CHECK_GAS_PRESSURE','Đo áp suất khí cắt','gas','Đo áp suất động khi đang cắt, không chỉ áp suất tĩnh; so sánh với recipe chuẩn.',1,1),
('CHECK_SOURCE_POWER','Kiểm tra công suất nguồn','laser','So sánh công suất yêu cầu, công suất phản hồi và nếu có thiết bị phù hợp thì đo công suất đầu ra theo quy trình an toàn.',3,2),
('CHECK_CONTROL_SIGNAL','Kiểm tra tín hiệu điều khiển','control','Kiểm tra enable, analog/digital command, feedback và nhiễu tại thời điểm tải thay đổi.',3,2),
('READ_SERVO_ALARM','Đọc mã alarm servo','motion','Ghi chính xác hãng, model driver và mã alarm; kiểm tra lịch sử alarm trước khi reset.',1,1),
('CHECK_BACKLASH','Đo độ rơ trục','motion','Đo sai số đảo chiều/lặp lại của trục để phân biệt servo với cơ khí.',2,1);

INSERT OR IGNORE INTO ai_cause_tests(cause_code,test_code,information_gain,expected_if_true) VALUES
('OPTICAL_CONTAMINATION','CHECK_PROTECTIVE_LENS',0.95,'Phát hiện kính bẩn, cháy hoặc suy hao quang học'),
('FOCUS_OFFSET','CHECK_FOCUS_REFERENCE',0.92,'Focus sweep cho thấy điểm tối ưu lệch khỏi giá trị đang dùng'),
('NOZZLE_ALIGNMENT','CHECK_NOZZLE_CENTER',0.95,'Dấu test cho thấy tia lệch tâm béc'),
('GAS_DELIVERY','CHECK_GAS_PRESSURE',0.92,'Áp suất động thấp hoặc tụt khi cắt'),
('LASER_SOURCE_OUTPUT','CHECK_SOURCE_POWER',0.90,'Công suất phản hồi/đo thực tế thấp hơn lệnh'),
('CONTROL_SIGNAL_INSTABILITY','CHECK_CONTROL_SIGNAL',0.85,'Command/feedback dao động hoặc nhiễu bất thường'),
('SERVO_DRIVE_FAULT','READ_SERVO_ALARM',0.93,'Mã alarm xác định nhánh driver/encoder/motor'),
('MECHANICAL_BACKLASH','CHECK_BACKLASH',0.88,'Độ rơ hoặc sai số đảo chiều vượt ngưỡng');
