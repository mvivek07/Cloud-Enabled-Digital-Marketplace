<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Farmer-to-Business Produce Exchange Platform — README</title>
  <meta name="description" content="Digital platform connecting farmers with local businesses to sell surplus or cosmetically imperfect produce." />
  <style>
    :root{
      --bg:#fbfcfd; --card:#ffffff; --muted:#6b7280; --accent:#16a34a;
      --maxw:900px;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
      color:#0f172a;
    }
    body{background:linear-gradient(180deg,#f7f9fb 0%, #ffffff 100%); margin:0; padding:32px; display:flex; justify-content:center;}
    .wrap{width:100%; max-width:var(--maxw); background:var(--card); border-radius:12px; box-shadow:0 6px 24px rgba(15,23,42,0.06); padding:28px;}
    header{display:flex; align-items:center; gap:16px; margin-bottom:18px;}
    header h1{font-size:20px; margin:0;}
    header p{margin:0; color:var(--muted); font-size:13px;}
    .badge{background:rgba(22,163,74,0.12); color:var(--accent); padding:6px 10px; border-radius:999px; font-weight:600; font-size:13px;}
    section{margin-top:18px;}
    h2{font-size:16px; margin:0 0 10px 0;}
    p{margin:0 0 10px 0; line-height:1.5; color:#0b1220;}
    .grid{display:grid; gap:12px;}
    .cols-2{grid-template-columns:1fr 1fr;}
    table{width:100%; border-collapse:collapse; font-size:14px;}
    th, td{padding:10px 8px; border-bottom:1px solid #eef2f7; text-align:left; vertical-align:top;}
    th{background:#fbfdff; color:#0b1220; font-weight:700; font-size:13px;}
    pre{background:#0f172a; color:#e6eef6; padding:12px; border-radius:8px; overflow:auto; font-size:13px;}
    .cta{display:inline-block; margin-top:12px; background:var(--accent); color:white; padding:10px 14px; border-radius:8px; text-decoration:none; font-weight:600;}
    footer{margin-top:20px; color:var(--muted); font-size:13px;}
    @media (max-width:680px){ .cols-2{grid-template-columns:1fr;} header{flex-direction:column; align-items:flex-start} }
  </style>
</head>
<body>
  <article class="wrap" role="main">
    <header>
      <div class="badge">🌱 PBL — Cloud Computing (22CBS73)</div>
      <div>
        <h1>Farmer-to-Business Produce Exchange Platform — README</h1>
        <p>Digital platform connecting farmers with local businesses to buy/sell surplus or cosmetically imperfect produce.</p>
      </div>
    </header>

    <section>
      <h2>Project Overview</h2>
      <p>
        A large amount of fresh farm produce is discarded every year because of cosmetic standards. This platform (web &amp; mobile) connects local farmers with businesses — juice bars, caterers, restaurants, and community kitchens — allowing farmers to list surplus or imperfect produce for sale and businesses to buy at reduced prices.
      </p>
    </section>

    <section class="grid">
      <div>
        <h2>Objectives</h2>
        <ul>
          <li>Reduce food waste by creating a structured channel for imperfect but fresh produce.</li>
          <li>Improve farmer income via a direct-selling platform.</li>
          <li>Provide affordable produce to local businesses and NGOs.</li>
          <li>Promote sustainability and strengthen local food ecosystems.</li>
        </ul>
      </div>

      <div>
        <h2>Target Users</h2>
        <ul>
          <li><strong>Farmers</strong> — sell surplus or cosmetically imperfect produce.</li>
          <li><strong>Local Businesses</strong> — juice bars, caterers, restaurants seeking low-cost ingredients.</li>
          <li><strong>Community Kitchens / NGOs</strong> — need budget-friendly fresh produce.</li>
        </ul>
      </div>
    </section>

    <section>
      <h2>Key Features</h2>
      <table>
        <thead>
          <tr><th>Feature</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td>Farmer Registration</td><td>Farmers can create profiles and list available produce.</td></tr>
          <tr><td>Produce Listing</td><td>Add product details (type, quantity, price, pickup/delivery).</td></tr>
          <tr><td>Buyer Browsing</td><td>Businesses can explore listings and search by category or location.</td></tr>
          <tr><td>Order &amp; Negotiation</td><td>Buyers can place orders or communicate directly with farmers.</td></tr>
          <tr><td>Logistics Support</td><td>Optional delivery or pickup system.</td></tr>
          <tr><td>Rating &amp; Review System</td><td>Builds trust and transparency between users.</td></tr>
        </tbody>
      </table>
    </section>

    <section class="grid cols-2">
      <div>
        <h2>Technology Stack</h2>
        <table>
          <thead><tr><th>Category</th><th>Tools / Technologies</th></tr></thead>
          <tbody>
            <tr><td>Frontend</td><td>React / HTML / CSS / JavaScript</td></tr>
            <tr><td>Backend</td><td>Node.js / Express / Python (optional)</td></tr>
            <tr><td>Database</td><td>MySQL / Firebase / MongoDB</td></tr>
            <tr><td>Cloud Hosting</td><td>AWS / Azure / GCP</td></tr>
            <tr><td>Version Control</td><td>Git &amp; GitHub</td></tr>
          </tbody>
        </table>
      </div>

      <div>
        <h2>System Workflow</h2>
        <ol>
          <li>Farmers list surplus or imperfect produce.</li>
          <li>Businesses browse available items and place orders.</li>
          <li>Logistics arranged through pickup or delivery.</li>
          <li>Secure transaction &amp; communication within the platform.</li>
          <li>Rate &amp; review system ensures trust and quality.</li>
        </ol>
      </div>
    </section>

    <section>
      <h2>Expected Outcomes</h2>
      <ul>
        <li>Reduced food waste at farm level.</li>
        <li>Increased income opportunities for farmers.</li>
        <li>Lower procurement costs for business buyers.</li>
        <li>More sustainable and community-focused local food systems.</li>
      </ul>
    </section>

    <section>
      <h2>Project Timeline</h2>
      <table>
        <thead><tr><th>Phase</th><th>Duration</th></tr></thead>
        <tbody>
          <tr><td>Research &amp; Requirement Analysis</td><td>Week 1</td></tr>
          <tr><td>Ideation &amp; System Design</td><td>Week 2</td></tr>
          <tr><td>Development – Core Features</td><td>Week 3–5</td></tr>
          <tr><td>Testing &amp; Refinement</td><td>Week 6</td></tr>
          <tr><td>Pilot Launch</td><td>Week 7</td></tr>
          <tr><td>Evaluation &amp; Final Report</td><td>Week 8</td></tr>
        </tbody>
      </table>
    </section>

    <section>
      <h2>Installation (Web Application)</h2>
      <pre>
# Clone this repository
git clone https://github.com/your-repository-url.git

# Navigate to project folder
cd farm-to-business-platform

# Install dependencies
npm install

# Start development server
npm start
      </pre>
    </section>

    <section>
      <h2>Contributors</h2>
      <p>
        Raksha Shenoy P – 4SO22CB031<br/>
        Suptha Surendra Shetty – 4SO22CB055<br/>
        Vedanth V J – 4SO22CB059<br/>
        Veeranagouda – 4SO22CB063<br/>
        Vivek M – 4SO22CB060
      </p>
      <p><strong>Faculty Guide:</strong> Ms. Aishwarya Acharya — Department of Computer Science &amp; Business System, St. Joseph Engineering College, Mangaluru</p>
    </section>

    <section>
      <h2>License</h2>
      <p>This project is developed for educational purposes under Project-Based Learning (PBL). You may reuse or modify the code with proper attribution.</p>
    </section>

    <section>
      <h2>Project Report (Uploaded)</h2>
      <p>Full first evaluation report is available:</p>
      <a class="cta" href="sandbox:/mnt/data/PBL_Report.pdf" download>📄 Download Project Report (PBL_Report.pdf)</a>
    </section>

    <footer>
      <p>Generated README HTML — edit as needed for your repository or presentation.</p>
    </footer>
  </article>
</body>
</html>
