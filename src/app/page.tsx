const modules = [
  { title: "Dịch vụ kỹ thuật", value: "0", note: "Phiếu đang xử lý" },
  { title: "Máy móc", value: "0", note: "Thiết bị được quản lý" },
  { title: "Kho phụ tùng", value: "0", note: "Mặt hàng cần bổ sung" },
  { title: "Kinh doanh", value: "0 ₫", note: "Doanh thu tháng này" },
];

export default function Home() {
  return (
    <main>
      <header className="topbar">
        <div className="brand"><span>PK</span> LASER OS</div>
        <div className="environment">PRODUCTION FOUNDATION</div>
      </header>
      <section className="hero">
        <p className="eyebrow">TRUNG TÂM ĐIỀU HÀNH</p>
        <h1>Mọi hoạt động PK LASER<br />trên một hệ thống.</h1>
        <p className="subtitle">
          Quản lý máy, phiếu kỹ thuật, kho, kinh doanh và dữ liệu vận hành theo thời gian thực.
        </p>
      </section>
      <section className="grid" aria-label="Chỉ số tổng quan">
        {modules.map((module) => (
          <article className="card" key={module.title}>
            <p>{module.title}</p>
            <strong>{module.value}</strong>
            <small>{module.note}</small>
          </article>
        ))}
      </section>
      <section className="status">
        <span className="pulse" />
        Nền tảng hệ thống đã sẵn sàng để kết nối cơ sở dữ liệu
      </section>
    </main>
  );
}
