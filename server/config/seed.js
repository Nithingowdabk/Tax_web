require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const db = require('./database');
const { v4: uuidv4 } = require('uuid');

async function seed() {
  console.log('🌱 Seeding database...\n');

  // ── Seed Services ──────────────────────────────────────────
  const services = [
    // GST Services
    {
      slug: 'gst-registration', category: 'GST Services', title: 'GST Registration',
      short_desc: 'Get your business GST-compliant with hassle-free registration.',
      description: 'GST Registration is mandatory for businesses with an annual turnover exceeding ₹40 lakhs (₹20 lakhs for special category states). Our experts handle the entire registration process from application to certificate issuance, ensuring zero errors and quick approval.',
      who_needs: 'Businesses with annual turnover exceeding ₹40 lakhs, inter-state sellers, e-commerce operators, NRIs doing business in India, casual taxable persons, and agents of suppliers.',
      documents_required: JSON.stringify(['PAN Card of Business/Owner', 'Aadhaar Card', 'Proof of Business Address', 'Bank Account Statement/Cancelled Cheque', 'Photograph of Owner/Partners', 'Digital Signature (for companies)', 'Incorporation Certificate (for companies)', 'Authorization Letter']),
      process_steps: JSON.stringify(['Submit required documents', 'Application filing on GST Portal', 'ARN generation', 'Verification by GST Officer', 'GSTIN issuance within 3-7 working days']),
      price_starting: 1499, price_label: 'Starting from ₹1,499', sort_order: 1
    },
    {
      slug: 'gst-return-filing', category: 'GST Services', title: 'GST Return Filing',
      short_desc: 'Timely and accurate GST return filing to keep your business penalty-free.',
      description: 'Regular GST return filing is essential to maintain compliance and avoid hefty penalties. We handle GSTR-1, GSTR-3B, GSTR-9, and GSTR-9C filings with meticulous accuracy. Our team ensures timely submission, proper input tax credit reconciliation, and complete peace of mind.',
      who_needs: 'All registered GST taxpayers, businesses filing monthly or quarterly returns, composition scheme dealers, and businesses requiring annual return filing.',
      documents_required: JSON.stringify(['Sales & Purchase Invoices', 'Credit/Debit Notes', 'Bank Statements', 'Previous Return Copies', 'HSN-wise Summary', 'E-way Bills (if applicable)']),
      process_steps: JSON.stringify(['Collect and verify invoices', 'Reconcile purchases with GSTR-2A', 'Prepare return summary', 'Client review and approval', 'File return before deadline', 'Share acknowledgment receipt']),
      price_starting: 999, price_label: 'Starting from ₹999/month', sort_order: 2
    },
    {
      slug: 'gst-annual-return', category: 'GST Services', title: 'GST Annual Return (GSTR-9/9C)',
      short_desc: 'Comprehensive annual return filing with audit certification.',
      description: 'The GST Annual Return (GSTR-9) is a mandatory yearly filing for all regular taxpayers. For businesses with turnover above ₹5 crore, a reconciliation statement (GSTR-9C) certified by a CA is required. We ensure complete accuracy with thorough reconciliation.',
      who_needs: 'All regular GST-registered taxpayers with annual turnover reporting requirements.',
      documents_required: JSON.stringify(['Monthly/Quarterly Return Copies', 'Books of Accounts', 'Trial Balance', 'Sales & Purchase Registers', 'ITC Register', 'HSN Summary']),
      process_steps: JSON.stringify(['Collect all monthly/quarterly returns', 'Reconcile with books of accounts', 'Prepare GSTR-9 draft', 'Prepare GSTR-9C reconciliation (if applicable)', 'Client review', 'File annual return']),
      price_starting: 4999, price_label: 'Starting from ₹4,999', sort_order: 3
    },
    // Income Tax Services
    {
      slug: 'income-tax-filing-individual', category: 'Income Tax', title: 'Income Tax Return – Individuals',
      short_desc: 'Expert ITR filing for salaried individuals, freelancers, and professionals.',
      description: 'Filing your Income Tax Return accurately is crucial to claim refunds, carry forward losses, and maintain a clean financial record. Our experts analyze your income sources, identify all eligible deductions under Section 80C, 80D, HRA, and more to minimize your tax liability legally.',
      who_needs: 'Salaried employees, freelancers, consultants, professionals, NRIs with Indian income, individuals with capital gains, rental income, or multiple income sources.',
      documents_required: JSON.stringify(['PAN Card', 'Aadhaar Card', 'Form 16', 'Bank Statements', 'Investment Proofs (80C, 80D, etc.)', 'Home Loan Interest Certificate', 'Rental Income Details', 'Capital Gains Statement', 'Foreign Income Details (if any)']),
      process_steps: JSON.stringify(['Gather income & investment documents', 'Analyze income sources', 'Identify applicable deductions', 'Compute tax liability', 'Prepare and review ITR', 'E-file and share acknowledgment']),
      price_starting: 799, price_label: 'Starting from ₹799', sort_order: 4
    },
    {
      slug: 'income-tax-filing-business', category: 'Income Tax', title: 'Income Tax Return – Business/Firm',
      short_desc: 'Comprehensive ITR filing for businesses, firms, and companies.',
      description: 'Business tax filing involves intricate calculations of income, expenses, depreciation, and advance tax. Our team ensures accurate profit & loss computation, proper claiming of business expenses, and compliance with all statutory requirements including tax audit provisions.',
      who_needs: 'Proprietorship firms, partnership firms, LLPs, private limited companies, and businesses with turnover above ₹1 crore.',
      documents_required: JSON.stringify(['Financial Statements', 'Balance Sheet & P&L', 'Bank Statements', 'GST Returns', 'TDS Certificates', 'Depreciation Schedule', 'Tax Audit Report (if applicable)', 'Books of Accounts']),
      process_steps: JSON.stringify(['Review financial statements', 'Compute business income', 'Calculate depreciation and deductions', 'Prepare computation of income', 'Tax audit (if applicable)', 'E-file return and share acknowledgment']),
      price_starting: 2999, price_label: 'Starting from ₹2,999', sort_order: 5
    },
    {
      slug: 'tax-planning', category: 'Income Tax', title: 'Tax Planning & Advisory',
      short_desc: 'Strategic tax planning to legally minimize your tax burden.',
      description: 'Proactive tax planning can save you significant money. Our advisory service includes analyzing your financial situation, recommending tax-saving investments, structuring your income optimally, and providing year-round guidance on tax-efficient decisions.',
      who_needs: 'High-income individuals, business owners, investors, NRIs, and anyone looking to optimize their tax outflow.',
      documents_required: JSON.stringify(['Previous Year ITR', 'Salary Slips', 'Investment Portfolio', 'Loan Details', 'Insurance Policies', 'Property Details']),
      process_steps: JSON.stringify(['Comprehensive financial review', 'Identify tax-saving opportunities', 'Recommend investment options', 'Create tax planning roadmap', 'Quarterly review meetings', 'Year-end optimization']),
      price_starting: 1999, price_label: 'Starting from ₹1,999', sort_order: 6
    },
    // Company Compliance
    {
      slug: 'annual-compliance-pvtltd', category: 'Company Compliance', title: 'Annual Compliance – Private Limited',
      short_desc: 'Complete annual compliance package for private limited companies.',
      description: 'Every private limited company must comply with annual filing requirements under the Companies Act. This includes filing annual returns (AOC-4, MGT-7), conducting board meetings, maintaining statutory registers, and more. Non-compliance leads to heavy penalties and even director disqualification.',
      who_needs: 'All registered Private Limited Companies operating in India.',
      documents_required: JSON.stringify(['Audited Financial Statements', 'Board Meeting Minutes', 'Statutory Registers', 'Director KYC Details', 'Share Transfer Register', 'Bank Statements']),
      process_steps: JSON.stringify(['Review corporate records', 'Prepare board & AGM minutes', 'File AOC-4 (Financial Statements)', 'File MGT-7 (Annual Return)', 'Director KYC (DIR-3 KYC)', 'Maintain statutory registers']),
      price_starting: 7999, price_label: 'Starting from ₹7,999/year', sort_order: 7
    },
    {
      slug: 'roc-filing', category: 'Company Compliance', title: 'ROC Filing & Compliance',
      short_desc: 'Timely ROC filings to avoid penalties and keep your company active.',
      description: 'ROC (Registrar of Companies) filings are mandatory for every registered company. We handle various ROC filings including change of directors, registered office change, share allotment, charge creation, and more with accuracy and within deadlines.',
      who_needs: 'All companies registered with MCA requiring periodic filings and event-based compliance.',
      documents_required: JSON.stringify(['Board Resolutions', 'Shareholder Resolutions', 'Updated MOA/AOA', 'Director Details', 'Financial Statements', 'DSC of Directors']),
      process_steps: JSON.stringify(['Identify applicable filings', 'Prepare required documents', 'Draft board/shareholder resolutions', 'File forms on MCA Portal', 'Follow up with ROC', 'Share approved documents']),
      price_starting: 2499, price_label: 'Starting from ₹2,499/filing', sort_order: 8
    },
    // Business Registration
    {
      slug: 'company-incorporation', category: 'Business Registration', title: 'Company Incorporation',
      short_desc: 'Register your Private Limited, LLP, or One Person Company seamlessly.',
      description: 'Starting a business starts with proper registration. We handle the complete incorporation process including name reservation, DSC & DIN generation, MOA/AOA drafting, and certificate of incorporation. Get your business legally set up with all required registrations in one package.',
      who_needs: 'Entrepreneurs starting a new business, partnerships converting to companies, NRIs establishing Indian businesses, and startups seeking formal structure.',
      documents_required: JSON.stringify(['PAN & Aadhaar of Directors', 'Address Proof of Directors', 'Registered Office Address Proof', 'Utility Bill', 'NOC from Owner', 'Passport-size Photographs', 'Digital Signature Certificate']),
      process_steps: JSON.stringify(['Name availability check', 'Obtain DSC & DIN', 'Draft MOA & AOA', 'File SPICe+ form', 'MCA processing & approval', 'Receive Certificate of Incorporation', 'Apply for PAN & TAN']),
      price_starting: 6999, price_label: 'Starting from ₹6,999', sort_order: 9
    },
    {
      slug: 'msme-registration', category: 'Business Registration', title: 'MSME/Udyam Registration',
      short_desc: 'Get MSME benefits with Udyam Registration – completely free filing.',
      description: 'Udyam Registration (formerly MSME Registration) provides numerous benefits including priority sector lending, lower interest rates, protection against delayed payments, and concession on electricity bills. The registration process is now Aadhaar-based and our team ensures smooth completion.',
      who_needs: 'Micro, Small, and Medium Enterprises in manufacturing or service sectors with eligible turnover and investment limits.',
      documents_required: JSON.stringify(['Aadhaar Card of Owner', 'PAN Card', 'Business Address Proof', 'Bank Account Details', 'Previous Year Turnover Details', 'NIC Code of Activity']),
      process_steps: JSON.stringify(['Verify eligibility', 'Collect Aadhaar & PAN details', 'Fill Udyam Registration Form', 'Submit on official portal', 'Receive Udyam Certificate', 'Guide on availing benefits']),
      price_starting: 499, price_label: 'Starting from ₹499', sort_order: 10
    },
    // Licenses
    {
      slug: 'fssai-license', category: 'Licenses', title: 'FSSAI Food License',
      short_desc: 'Mandatory food license for food businesses – basic to central.',
      description: 'Every food business operator in India must obtain an FSSAI license. Whether you run a small restaurant, a food processing unit, or an import/export business, we help you obtain the appropriate license (Basic, State, or Central) based on your turnover and business type.',
      who_needs: 'Food manufacturers, processors, restaurants, caterers, food importers/exporters, online food delivery, and food storage businesses.',
      documents_required: JSON.stringify(['Identity Proof', 'Business Address Proof', 'Food Safety Management Plan', 'List of Equipment', 'Water Test Report', 'NOC from Municipality', 'Partnership Deed/MOA (if applicable)']),
      process_steps: JSON.stringify(['Determine license type (Basic/State/Central)', 'Collect documents', 'File application on FSSAI Portal', 'Schedule inspection (if required)', 'Receive license certificate', 'Compliance guidance']),
      price_starting: 1999, price_label: 'Starting from ₹1,999', sort_order: 11
    },
    {
      slug: 'trade-license', category: 'Licenses', title: 'Trade License & Shop Act',
      short_desc: 'Essential trade license and Shop & Establishment registration.',
      description: 'A Trade License from the local municipality and Shop & Establishment registration are basic requirements for operating any business. We handle the entire application process, ensuring compliance with local regulations and timely issuance.',
      who_needs: 'All businesses operating from a physical premises, shops, commercial establishments, offices, and restaurants.',
      documents_required: JSON.stringify(['Identity Proof', 'Business Address Proof', 'Rent Agreement/Ownership Proof', 'Photographs of Premises', 'Employee Details', 'NOC from Owner']),
      process_steps: JSON.stringify(['Verify local requirements', 'Prepare application documents', 'Submit to local authority', 'Inspection (if required)', 'Receive license', 'Annual renewal guidance']),
      price_starting: 999, price_label: 'Starting from ₹999', sort_order: 12
    },
    // Payroll & Employee Compliance
    {
      slug: 'payroll-processing', category: 'Payroll & Employee Compliance', title: 'Payroll Processing',
      short_desc: 'End-to-end payroll management for businesses of all sizes.',
      description: 'Accurate payroll processing is critical for employee satisfaction and legal compliance. We handle salary computation, TDS deduction, PF/ESI calculations, payslip generation, and monthly compliance filings. Our service ensures zero errors and on-time payments.',
      who_needs: 'Businesses with employees, startups scaling their team, companies looking to outsource payroll management.',
      documents_required: JSON.stringify(['Employee Master Data', 'Attendance Records', 'Salary Structure', 'Investment Declarations', 'PAN & Aadhaar of Employees', 'Bank Account Details']),
      process_steps: JSON.stringify(['Setup salary structure', 'Monthly attendance processing', 'Salary computation with deductions', 'TDS calculation under Section 192', 'PF/ESI computation', 'Generate payslips', 'Process bank transfers']),
      price_starting: 1499, price_label: 'Starting from ₹1,499/month', sort_order: 13
    },
    {
      slug: 'pf-esi-registration', category: 'Payroll & Employee Compliance', title: 'PF & ESI Registration & Filing',
      short_desc: 'Complete Provident Fund and ESI compliance management.',
      description: 'Businesses with eligible employees must register for PF (Provident Fund) and ESI (Employee State Insurance). We handle registration, monthly return filing, annual returns, and compliance management to ensure you meet all statutory obligations.',
      who_needs: 'Businesses with 10+ employees (ESI) or 20+ employees (PF), or voluntarily registering for employee benefits.',
      documents_required: JSON.stringify(['PAN of Business', 'Address Proof', 'Registration Certificate', 'Employee Details', 'Bank Details', 'Digital Signature']),
      process_steps: JSON.stringify(['Determine eligibility', 'File registration application', 'Receive PF/ESI codes', 'Monthly return filing', 'Employee onboarding on portal', 'Annual return filing']),
      price_starting: 1999, price_label: 'Starting from ₹1,999', sort_order: 14
    }
  ];

  for (const svc of services) {
    try {
      await db.query(`
        INSERT INTO services (slug, category, title, short_desc, description, who_needs, documents_required, process_steps, price_starting, price_label, sort_order, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)
        ON DUPLICATE KEY UPDATE title=VALUES(title), description=VALUES(description), price_starting=VALUES(price_starting)
      `, [svc.slug, svc.category, svc.title, svc.short_desc, svc.description, svc.who_needs, svc.documents_required, svc.process_steps, svc.price_starting, svc.price_label, svc.sort_order]);
    } catch(e) { /* ignore duplicates */ }
  }
  console.log(`  ✅ ${services.length} services seeded`);

  // ── Seed Blog Posts ────────────────────────────────────────
  const posts = [
    {
      slug: 'gst-registration-guide-2026',
      title: 'Complete Guide to GST Registration in 2026',
      excerpt: 'Everything you need to know about GST registration – eligibility, documents, process, and common mistakes to avoid.',
      content: '<h2>Who Needs GST Registration?</h2><p>GST registration is mandatory for businesses with aggregate turnover exceeding ₹40 lakhs for goods and ₹20 lakhs for services...</p>',
      category: 'GST',
      tags: 'gst,registration,compliance'
    },
    {
      slug: 'income-tax-saving-tips',
      title: '10 Legal Ways to Save Income Tax in FY 2025-26',
      excerpt: 'Discover proven strategies to minimize your tax burden while staying fully compliant with tax laws.',
      content: '<h2>Smart Tax Planning</h2><p>Tax planning is not about tax evasion – it is about making informed financial decisions...</p>',
      category: 'Income Tax',
      tags: 'income-tax,tax-saving,planning'
    }
  ];

  for (const post of posts) {
    try {
      await db.query(`
        INSERT INTO blog_posts (slug, title, excerpt, content, category, tags, author_id, is_published, published_at)
        VALUES (?, ?, ?, ?, ?, ?, 1, TRUE, NOW())
        ON DUPLICATE KEY UPDATE title=VALUES(title)
      `, [post.slug, post.title, post.excerpt, post.content, post.category, post.tags]);
    } catch(e) {}
  }
  console.log(`  ✅ ${posts.length} blog posts seeded`);

  console.log('\n✅ Seeding complete!\n');
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
