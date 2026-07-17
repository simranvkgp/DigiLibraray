// Admin panel strings (nav, headers, table columns, buttons).
export const admin = {
  en: {
    // Sidebar nav
    "admin.nav.brand": "VK Digital Library Admin",
    "admin.nav.books": "Books",
    "admin.nav.users": "Users",
    "admin.nav.boards": "Boards",
    "admin.nav.categories": "Categories",
    "admin.nav.institutions": "Institutions",
    "admin.nav.analytics": "Analytics",
    "admin.nav.notifications": "Notifications",
    "admin.nav.logs": "Logs",

    // Dashboard
    "admin.dashboard.totalUsers": "Total users",
    "admin.dashboard.pendingApprovals": "Pending approvals",
    "admin.dashboard.totalBooks": "Books in library",
    "admin.dashboard.totalViews": "Total views",

    // Generic shared bits
    "admin.common.all": "All",
    "admin.common.selectPlaceholder": "Select...",

    // Generic field labels reused across forms/tables
    "admin.field.title": "Title",
    "admin.field.subject": "Subject",
    "admin.field.author": "Author",
    "admin.field.category": "Category",
    "admin.field.board": "Board",
    "admin.field.fileType": "File type",
    "admin.field.description": "Description",
    "admin.field.type": "Type",
    "admin.field.institution": "Institution",
    "admin.field.user": "User",

    // Generic table column headers
    "admin.table.categoryBoard": "Category / Board",
    "admin.table.status": "Status",
    "admin.table.actions": "Actions",
    "admin.table.views": "Views",

    // User approval status labels
    "admin.status.pending": "Pending",
    "admin.status.approved": "Approved",
    "admin.status.rejected": "Rejected",
    "admin.status.suspended": "Suspended",
    "admin.status.incomplete": "Incomplete",

    // Users page / table
    "admin.users.subtitle": "Approve, reject, suspend, reactivate, or remove accounts.",
    "admin.users.col.name": "Name",
    "admin.users.col.booksRead": "Books read",
    "admin.users.col.role": "Role",
    "admin.users.role.superAdmin": "Super Admin",
    "admin.users.role.admin": "Admin",
    "admin.users.role.user": "User",
    "admin.users.makeAdmin": "Make admin",
    "admin.users.removeAdmin": "Remove admin",
    "admin.users.approve": "Approve",
    "admin.users.reject": "Reject",
    "admin.users.suspend": "Suspend",
    "admin.users.reactivate": "Reactivate",
    "admin.users.confirmDelete": "Permanently delete this user? This can't be undone.",
    "admin.users.empty": "No users in this view.",

    // Books page / table
    "admin.books.subtitle": "Add books by pasting a Google Drive share link. No upload needed for the book file itself, but you can upload a cover image.",
    "admin.books.addNew": "Add book",
    "admin.books.status.published": "Published",
    "admin.books.status.draft": "Draft",
    "admin.books.status.archived": "Archived",
    "admin.books.status.hidden": "Hidden",
    "admin.books.publish": "Publish",
    "admin.books.archive": "Archive",
    "admin.books.hide": "Hide",
    "admin.books.duplicate": "Duplicate",
    "admin.books.confirmDelete": "Delete this book permanently?",
    "admin.books.empty": "No books yet — add your first one.",
    "admin.books.form.driveLink": "Google Drive share link",
    "admin.books.form.classSemester": "Class / Semester",
    "admin.books.form.coverImageUrl": "Cover image URL",
    "admin.books.form.or": "or",
    "admin.books.form.uploadImage": "Upload image",
    "admin.books.form.uploading": "Uploading...",
    "admin.books.form.uploadError": "Couldn't upload that image. Please try again.",
    "admin.books.form.pageCount": "Page count",
    "admin.books.form.error": "Couldn't add that book. Check the fields and try again.",
    "admin.books.form.adding": "Adding book...",

    // Categories page
    "admin.categories.subtitle": "Secondary, Senior Secondary, University, etc. Users choose one permanently at onboarding.",

    // Boards page
    "admin.boards.subtitle": "Boards used to filter the library (CBSE, ICSE, university, etc).",

    // Named list manager (categories/boards)
    "admin.namedList.newItemName": "New {item} name",
    "admin.namedList.add": "Add",
    "admin.namedList.addError": "Couldn't add that.",
    "admin.namedList.deleteError": "Couldn't delete that.",
    "admin.namedList.empty": "None yet.",

    // Institutions page
    "admin.institutions.subtitle": "Created automatically when users register — shown here for reference.",
    "admin.institutions.col.city": "City",
    "admin.institutions.col.state": "State",
    "admin.institutions.empty": "No institutions yet.",

    // Notifications page / composer
    "admin.notifications.subtitle": "Send announcements, new-book alerts, or maintenance updates to approved users.",
    "admin.notifications.newBroadcast": "New broadcast",
    "admin.notifications.type.announcement": "Announcement",
    "admin.notifications.type.newBook": "New book alert",
    "admin.notifications.type.maintenance": "Maintenance update",
    "admin.notifications.form.message": "Message",
    "admin.notifications.form.limitCategory": "Limit to category (optional)",
    "admin.notifications.form.limitBoard": "Limit to board (optional)",
    "admin.notifications.form.allCategories": "All categories",
    "admin.notifications.form.allBoards": "All boards",
    "admin.notifications.send": "Send to approved users",
    "admin.notifications.sending": "Sending...",
    "admin.notifications.sendError": "Couldn't send that notification. Please try again.",
    "admin.notifications.sentTo": "Sent to {count} recipient(s).",
    "admin.notifications.recent": "Recent broadcasts",
    "admin.notifications.empty": "No broadcasts sent yet.",
    "admin.notifications.recipientsLabel": "{count} recipients",

    // Analytics page / dashboard
    "admin.analytics.subtitle": "Usage trends across users and books.",
    "admin.analytics.loading": "Loading analytics...",
    "admin.analytics.activeUsers": "Active users",
    "admin.analytics.pendingUsers": "Pending users",
    "admin.analytics.totalDownloads": "Total downloads",
    "admin.analytics.dailyLogins": "Daily logins (last 30 days)",
    "admin.analytics.popularBooks": "Popular books",
    "admin.analytics.monthlyActivity": "Monthly activity (last 6 months)",

    // Logs page
    "admin.logs.title": "Activity logs",
    "admin.logs.subtitle": "Recent system events across all users.",
    "admin.logs.col.when": "When",
    "admin.logs.col.action": "Action",
    "admin.logs.action.login": "Login",
    "admin.logs.action.register": "Register",
    "admin.logs.action.bookView": "Book view",
    "admin.logs.action.bookDownload": "Book download",
    "admin.logs.empty": "No activity yet.",

    // Admin settings page
    "admin.settings.subtitle": "Your admin account preferences.",
  } as Record<string, string>,
  hi: {
    // Sidebar nav
    "admin.nav.brand": "VK डिजिटल लाइब्रेरी एडमिन",
    "admin.nav.books": "पुस्तकें",
    "admin.nav.users": "उपयोगकर्ता",
    "admin.nav.boards": "बोर्ड",
    "admin.nav.categories": "श्रेणियाँ",
    "admin.nav.institutions": "संस्थान",
    "admin.nav.analytics": "विश्लेषण",
    "admin.nav.notifications": "सूचनाएं",
    "admin.nav.logs": "लॉग",

    // Dashboard
    "admin.dashboard.totalUsers": "कुल उपयोगकर्ता",
    "admin.dashboard.pendingApprovals": "लंबित अनुमोदन",
    "admin.dashboard.totalBooks": "लाइब्रेरी में पुस्तकें",
    "admin.dashboard.totalViews": "कुल दृश्य",

    // Generic shared bits
    "admin.common.all": "सभी",
    "admin.common.selectPlaceholder": "चुनें...",

    // Generic field labels reused across forms/tables
    "admin.field.title": "शीर्षक",
    "admin.field.subject": "विषय",
    "admin.field.author": "लेखक",
    "admin.field.category": "श्रेणी",
    "admin.field.board": "बोर्ड",
    "admin.field.fileType": "फ़ाइल प्रकार",
    "admin.field.description": "विवरण",
    "admin.field.type": "प्रकार",
    "admin.field.institution": "संस्थान",
    "admin.field.user": "उपयोगकर्ता",

    // Generic table column headers
    "admin.table.categoryBoard": "श्रेणी / बोर्ड",
    "admin.table.status": "स्थिति",
    "admin.table.actions": "कार्रवाई",
    "admin.table.views": "दृश्य",

    // User approval status labels
    "admin.status.pending": "लंबित",
    "admin.status.approved": "स्वीकृत",
    "admin.status.rejected": "अस्वीकृत",
    "admin.status.suspended": "निलंबित",
    "admin.status.incomplete": "अधूरा",

    // Users page / table
    "admin.users.subtitle": "खातों को स्वीकृत, अस्वीकृत, निलंबित, पुनः सक्रिय करें या हटाएं।",
    "admin.users.col.name": "नाम",
    "admin.users.col.booksRead": "पढ़ी गई पुस्तकें",
    "admin.users.col.role": "भूमिका",
    "admin.users.role.superAdmin": "सुपर एडमिन",
    "admin.users.role.admin": "एडमिन",
    "admin.users.role.user": "उपयोगकर्ता",
    "admin.users.makeAdmin": "एडमिन बनाएं",
    "admin.users.removeAdmin": "एडमिन हटाएं",
    "admin.users.approve": "स्वीकृत करें",
    "admin.users.reject": "अस्वीकृत करें",
    "admin.users.suspend": "निलंबित करें",
    "admin.users.reactivate": "पुनः सक्रिय करें",
    "admin.users.confirmDelete": "इस उपयोगकर्ता को स्थायी रूप से हटाएं? इसे पूर्ववत नहीं किया जा सकता।",
    "admin.users.empty": "इस दृश्य में कोई उपयोगकर्ता नहीं है।",

    // Books page / table
    "admin.books.subtitle": "Google Drive शेयर लिंक पेस्ट करके पुस्तकें जोड़ें। पुस्तक फ़ाइल के लिए अपलोड ज़रूरी नहीं, लेकिन आप कवर छवि अपलोड कर सकते हैं।",
    "admin.books.addNew": "पुस्तक जोड़ें",
    "admin.books.status.published": "प्रकाशित",
    "admin.books.status.draft": "मसौदा",
    "admin.books.status.archived": "संग्रहीत",
    "admin.books.status.hidden": "छिपी हुई",
    "admin.books.publish": "प्रकाशित करें",
    "admin.books.archive": "संग्रहीत करें",
    "admin.books.hide": "छिपाएं",
    "admin.books.duplicate": "डुप्लिकेट करें",
    "admin.books.confirmDelete": "इस पुस्तक को स्थायी रूप से हटाएं?",
    "admin.books.empty": "अभी तक कोई पुस्तक नहीं है — अपनी पहली पुस्तक जोड़ें।",
    "admin.books.form.driveLink": "Google Drive शेयर लिंक",
    "admin.books.form.classSemester": "कक्षा / सेमेस्टर",
    "admin.books.form.coverImageUrl": "कवर छवि URL",
    "admin.books.form.or": "या",
    "admin.books.form.uploadImage": "छवि अपलोड करें",
    "admin.books.form.uploading": "अपलोड हो रहा है...",
    "admin.books.form.uploadError": "वह छवि अपलोड नहीं हो सकी। कृपया फिर से प्रयास करें।",
    "admin.books.form.pageCount": "पृष्ठ संख्या",
    "admin.books.form.error": "वह पुस्तक नहीं जोड़ी जा सकी। फ़ील्ड जांचें और फिर से प्रयास करें।",
    "admin.books.form.adding": "पुस्तक जोड़ी जा रही है...",

    // Categories page
    "admin.categories.subtitle": "माध्यमिक, वरिष्ठ माध्यमिक, विश्वविद्यालय, आदि। उपयोगकर्ता ऑनबोर्डिंग के दौरान स्थायी रूप से एक श्रेणी चुनते हैं।",

    // Boards page
    "admin.boards.subtitle": "लाइब्रेरी को फ़िल्टर करने के लिए उपयोग किए जाने वाले बोर्ड (CBSE, ICSE, विश्वविद्यालय, आदि)।",

    // Named list manager (categories/boards)
    "admin.namedList.newItemName": "{item} का नया नाम",
    "admin.namedList.add": "जोड़ें",
    "admin.namedList.addError": "वह जोड़ा नहीं जा सका।",
    "admin.namedList.deleteError": "वह हटाया नहीं जा सका।",
    "admin.namedList.empty": "अभी तक कुछ भी नहीं।",

    // Institutions page
    "admin.institutions.subtitle": "उपयोगकर्ताओं के पंजीकरण करते ही स्वचालित रूप से बनाए जाते हैं — यहां केवल संदर्भ के लिए दिखाए गए हैं।",
    "admin.institutions.col.city": "शहर",
    "admin.institutions.col.state": "राज्य",
    "admin.institutions.empty": "अभी तक कोई संस्थान नहीं है।",

    // Notifications page / composer
    "admin.notifications.subtitle": "स्वीकृत उपयोगकर्ताओं को घोषणाएं, नई पुस्तक की सूचनाएं, या रखरखाव अपडेट भेजें।",
    "admin.notifications.newBroadcast": "नया प्रसारण",
    "admin.notifications.type.announcement": "घोषणा",
    "admin.notifications.type.newBook": "नई पुस्तक सूचना",
    "admin.notifications.type.maintenance": "रखरखाव अपडेट",
    "admin.notifications.form.message": "संदेश",
    "admin.notifications.form.limitCategory": "श्रेणी तक सीमित करें (वैकल्पिक)",
    "admin.notifications.form.limitBoard": "बोर्ड तक सीमित करें (वैकल्पिक)",
    "admin.notifications.form.allCategories": "सभी श्रेणियां",
    "admin.notifications.form.allBoards": "सभी बोर्ड",
    "admin.notifications.send": "स्वीकृत उपयोगकर्ताओं को भेजें",
    "admin.notifications.sending": "भेजा जा रहा है...",
    "admin.notifications.sendError": "वह सूचना नहीं भेजी जा सकी। कृपया फिर से प्रयास करें।",
    "admin.notifications.sentTo": "{count} प्राप्तकर्ताओं को भेजा गया।",
    "admin.notifications.recent": "हाल के प्रसारण",
    "admin.notifications.empty": "अभी तक कोई प्रसारण नहीं भेजा गया।",
    "admin.notifications.recipientsLabel": "{count} प्राप्तकर्ता",

    // Analytics page / dashboard
    "admin.analytics.subtitle": "उपयोगकर्ताओं और पुस्तकों में उपयोग के रुझान।",
    "admin.analytics.loading": "विश्लेषण लोड हो रहा है...",
    "admin.analytics.activeUsers": "सक्रिय उपयोगकर्ता",
    "admin.analytics.pendingUsers": "लंबित उपयोगकर्ता",
    "admin.analytics.totalDownloads": "कुल डाउनलोड",
    "admin.analytics.dailyLogins": "दैनिक लॉगिन (पिछले 30 दिन)",
    "admin.analytics.popularBooks": "लोकप्रिय पुस्तकें",
    "admin.analytics.monthlyActivity": "मासिक गतिविधि (पिछले 6 महीने)",

    // Logs page
    "admin.logs.title": "गतिविधि लॉग",
    "admin.logs.subtitle": "सभी उपयोगकर्ताओं की हाल की सिस्टम घटनाएं।",
    "admin.logs.col.when": "कब",
    "admin.logs.col.action": "कार्रवाई",
    "admin.logs.action.login": "लॉगिन",
    "admin.logs.action.register": "पंजीकरण",
    "admin.logs.action.bookView": "पुस्तक दृश्य",
    "admin.logs.action.bookDownload": "पुस्तक डाउनलोड",
    "admin.logs.empty": "अभी तक कोई गतिविधि नहीं है।",

    // Admin settings page
    "admin.settings.subtitle": "आपकी एडमिन खाता प्राथमिकताएं।",
  } as Record<string, string>,
};
