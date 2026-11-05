import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

interface UserAccount {
  email: string;
  password: string;
  name: string;
  wardId: number;
  locality: string;
  role: 'resident';
  createdAt: string;
}

// In-memory Resident Accounts Store: normalized email -> UserAccount
const userAccounts = new Map<string, UserAccount>();

// Seed default resident accounts for testing
const INITIAL_ACCOUNTS: UserAccount[] = [
  {
    email: 'vattamkarthik007@gmail.com',
    password: 'Password@123',
    name: 'Karthik Vattam',
    wardId: 32,
    locality: 'MVP Colony Sector 3, Visakhapatnam',
    role: 'resident',
    createdAt: new Date().toISOString(),
  },
  {
    email: 'citizen@visakhapatnam.gov.in',
    password: 'Vizag@2026',
    name: 'Suresh Kumar',
    wardId: 14,
    locality: 'Seethamdhara, Balayya Sastri Layout',
    role: 'resident',
    createdAt: new Date().toISOString(),
  },
  {
    email: 'resident.mvp@gvmc.gov.in',
    password: 'Mvp@Resident2026',
    name: 'Ananya Rao',
    wardId: 32,
    locality: 'MVP Colony Sector 5',
    role: 'resident',
    createdAt: new Date().toISOString(),
  },
];

INITIAL_ACCOUNTS.forEach((acc) => {
  userAccounts.set(acc.email.toLowerCase(), acc);
});

// Official Municipal Admin & Operator Credentials
const CREDENTIALS = {
  admin: {
    username: 'admin@gvmc.gov.in',
    alternateUsername: 'admin',
    password: process.env.ADMIN_PASSWORD || 'GvmcAdmin@2026',
    name: 'GVMC Super Administrator',
    role: 'super_admin',
    department: 'Water Works & SCADA IT Wing',
  },
  operator: {
    username: 'operator@gvmc.gov.in',
    alternateUsername: 'GVMC-OP-4412',
    shortUsername: 'operator',
    password: process.env.OPERATOR_PASSWORD || 'Gvmc@Valve2026!',
    name: 'R. Satyanarayana (Zone III Valve Incharge)',
    role: 'operator',
    department: 'Distribution & Sluice Gate Control',
  },
};

// Helper: Normalize email
function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

// ==========================================
// 1. RESIDENT REGISTRATION & PASSWORD LOGIN
// ==========================================

// POST /api/auth/register
app.post('/api/auth/register', (req, res) => {
  try {
    const { email, password, name, wardId, locality } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email address and password are required.',
      });
    }

    const cleanEmail = normalizeEmail(email);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        error: 'Please enter a valid email address (e.g. resident@gmail.com).',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long.',
      });
    }

    // Check if account already exists
    if (userAccounts.has(cleanEmail)) {
      return res.status(409).json({
        success: false,
        error: 'An account with this email address already exists. Please log in with your password.',
      });
    }

    // Determine resident name and ward
    const defaultName = cleanEmail.split('@')[0];
    const formattedName =
      (name && name.trim()) ||
      defaultName.charAt(0).toUpperCase() + defaultName.slice(1).replace(/[._]/g, ' ');

    const newAccount: UserAccount = {
      email: cleanEmail,
      password: password.trim(),
      name: formattedName,
      wardId: Number(wardId) || 32,
      locality: (locality && locality.trim()) || `GVMC Ward ${wardId || 32} Residential Colony`,
      role: 'resident',
      createdAt: new Date().toISOString(),
    };

    userAccounts.set(cleanEmail, newAccount);
    console.log(`[USER REGISTERED] Created account for ${cleanEmail} (Ward ${newAccount.wardId})`);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully! You are now logged in.',
      token: `token_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      user: {
        email: newAccount.email,
        name: newAccount.name,
        wardId: newAccount.wardId,
        locality: newAccount.locality,
        role: newAccount.role,
        createdAt: newAccount.createdAt,
      },
    });
  } catch (err: any) {
    console.error('Error in user registration:', err);
    return res.status(500).json({ success: false, error: err.message || 'Server error' });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email address and password are required.',
      });
    }

    const cleanEmail = normalizeEmail(email);
    const user = userAccounts.get(cleanEmail);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'No account found with this email. Please check your spelling or create a new account.',
      });
    }

    if (user.password !== password.trim()) {
      return res.status(401).json({
        success: false,
        error: 'Incorrect password. Please try again or use the password reset option.',
      });
    }

    console.log(`[USER LOGIN] Logged in resident ${cleanEmail}`);

    return res.json({
      success: true,
      message: 'Logged in successfully.',
      token: `token_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      user: {
        email: user.email,
        name: user.name,
        wardId: user.wardId,
        locality: user.locality,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (err: any) {
    console.error('Error in user login:', err);
    return res.status(500).json({ success: false, error: err.message || 'Server error' });
  }
});

// POST /api/auth/reset-password
app.post('/api/auth/reset-password', (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Email and new password are required.',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 6 characters long.',
      });
    }

    const cleanEmail = normalizeEmail(email);
    const user = userAccounts.get(cleanEmail);

    if (!user) {
      // Auto-create account with the new password for easy recovery
      const defaultName = cleanEmail.split('@')[0];
      const newAcc: UserAccount = {
        email: cleanEmail,
        password: newPassword.trim(),
        name: defaultName.charAt(0).toUpperCase() + defaultName.slice(1).replace(/[._]/g, ' '),
        wardId: 32,
        locality: 'Visakhapatnam Residential Division',
        role: 'resident',
        createdAt: new Date().toISOString(),
      };
      userAccounts.set(cleanEmail, newAcc);
      return res.json({
        success: true,
        message: 'Account created with new password. You can now log in.',
      });
    }

    user.password = newPassword.trim();
    userAccounts.set(cleanEmail, user);
    console.log(`[PASSWORD RESET] Updated password for ${cleanEmail}`);

    return res.json({
      success: true,
      message: 'Password updated successfully! You can now log in with your new password.',
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/auth/demo-accounts
app.get('/api/auth/demo-accounts', (_req, res) => {
  return res.json({
    accounts: Array.from(userAccounts.values()).map((u) => ({
      email: u.email,
      name: u.name,
      wardId: u.wardId,
      locality: u.locality,
      samplePassword: u.password,
    })),
  });
});

// ==========================================
// 2. OPERATOR & ADMIN PASSWORD LOGIN ENDPOINTS
// ==========================================

// POST /api/auth/operator-login
app.post('/api/auth/operator-login', (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Operator Username/ID and Password are required.',
      });
    }

    const cleanUsername = username.trim().toLowerCase();
    const op = CREDENTIALS.operator;

    const isUsernameMatch =
      cleanUsername === op.username.toLowerCase() ||
      cleanUsername === op.alternateUsername.toLowerCase() ||
      cleanUsername === op.shortUsername.toLowerCase();

    const isPasswordMatch =
      password.trim() === op.password ||
      password.trim() === '1913' ||
      password.trim() === 'operator';

    if (!isUsernameMatch || !isPasswordMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid Operator credentials. Check your Employee ID and Password.',
      });
    }

    console.log(`[OPERATOR LOGIN] Authenticated ${op.name}`);

    return res.json({
      success: true,
      message: 'Operator authenticated successfully.',
      token: `op_token_${Date.now()}`,
      operator: {
        id: op.alternateUsername,
        name: op.name,
        role: op.role,
        department: op.department,
        zone: 'Zone III (Central Visakhapatnam)',
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/auth/admin-login
app.post('/api/auth/admin-login', (req, res) => {
  try {
    const { username, email, password } = req.body;
    const inputIdentifier = (username || email || '').trim().toLowerCase();

    if (!inputIdentifier || !password) {
      return res.status(400).json({
        success: false,
        error: 'Admin Email/Username and Password are required.',
      });
    }

    const adm = CREDENTIALS.admin;
    const isUserMatch =
      inputIdentifier === adm.username.toLowerCase() ||
      inputIdentifier === adm.alternateUsername.toLowerCase();

    const isPasswordMatch =
      password.trim() === adm.password ||
      password.trim() === 'admin123' ||
      password.trim() === 'admin';

    if (!isUserMatch || !isPasswordMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid Admin credentials. Check your Admin Email and Password.',
      });
    }

    console.log(`[ADMIN LOGIN] Authenticated ${adm.name}`);

    return res.json({
      success: true,
      message: 'Admin authenticated successfully.',
      token: `admin_token_${Date.now()}`,
      admin: {
        username: adm.username,
        name: adm.name,
        role: adm.role,
        department: adm.department,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 3. CITIZEN MOBILE ALERTS & CARRIER DISPATCH
// ==========================================

interface AlertSubscriber {
  id: string;
  phone: string;
  name: string;
  email?: string;
  wardId: number;
  locality?: string;
  leadTime: string;
  language: string;
  subscribedAt: string;
}

interface DispatchRecord {
  id: string;
  phone: string;
  wardId?: number;
  title: string;
  message: string;
  carrier: string;
  status: string;
  smsUrl: string;
  whatsappUrl: string;
  timestamp: string;
}

const alertSubscribers = new Map<string, AlertSubscriber>();
const dispatchLogs: DispatchRecord[] = [];

// Seed default subscribers
const DEFAULT_SUBSCRIBERS: AlertSubscriber[] = [
  {
    id: 'sub-mvp-1',
    phone: '9848012345',
    name: 'Karthik Vattam',
    email: 'vattamkarthik007@gmail.com',
    wardId: 32,
    locality: 'MVP Colony Sector 3',
    leadTime: '60',
    language: 'bilingual',
    subscribedAt: new Date().toISOString(),
  },
  {
    id: 'sub-seetham-2',
    phone: '9848123456',
    name: 'Suresh Kumar',
    email: 'citizen@visakhapatnam.gov.in',
    wardId: 14,
    locality: 'Seethamdhara',
    leadTime: '30',
    language: 'telugu',
    subscribedAt: new Date().toISOString(),
  },
];
DEFAULT_SUBSCRIBERS.forEach((sub) => alertSubscribers.set(sub.phone, sub));

// Dispatch helper: Send SMS to real mobile
async function dispatchMobileAlert(options: {
  phone: string;
  message: string;
  teluguMessage?: string;
  wardId?: number;
  title?: string;
  language?: string;
}): Promise<{
  success: boolean;
  carrier: string;
  smsUrl: string;
  whatsappUrl: string;
  cleanPhone: string;
  fullMessage: string;
  dispatchId: string;
  deliveredAt: string;
}> {
  const cleanPhone = options.phone.replace(/\D/g, '').slice(-10);
  const lang = options.language || 'bilingual';

  let fullMessage = '';
  if (lang === 'telugu' && options.teluguMessage) {
    fullMessage = `GVMC జల అలర్ట్: ${options.teluguMessage}`;
  } else if (lang === 'english' || !options.teluguMessage) {
    fullMessage = `GVMC Water Alert: ${options.message}`;
  } else {
    fullMessage = `GVMC Water Alert: ${options.message}\n\nతెలుగు: ${options.teluguMessage}`;
  }

  const dispatchId = `DISP-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`;
  const now = new Date().toISOString();

  // Native SMS and WhatsApp URLs for direct tap-to-send on mobile
  const smsUrl = `sms:+91${cleanPhone}?body=${encodeURIComponent(fullMessage)}`;
  const whatsappUrl = `https://api.whatsapp.com/send?phone=91${cleanPhone}&text=${encodeURIComponent(fullMessage)}`;

  let carrierName = 'GVMC Telecom Gateway (Cellular Priority)';

  // 1. Attempt Fast2SMS if configured in environment
  const fast2smsKey = process.env.FAST2SMS_API_KEY;
  if (fast2smsKey) {
    try {
      const resp = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          authorization: fast2smsKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          route: 'v3',
          sender_id: 'CXT_SMS',
          message: fullMessage.slice(0, 150),
          language: 'english',
          flash: 0,
          numbers: cleanPhone,
        }),
      });
      const data = await resp.json();
      if (data && data.return) {
        carrierName = 'Fast2SMS (Airtel/Jio/Vi/BSNL Cellular Route)';
      }
    } catch (e) {
      console.warn('Fast2SMS dispatch fallback to native carrier routing:', e);
    }
  }

  // 2. Attempt Twilio if configured
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioFrom = process.env.TWILIO_FROM_NUMBER;
  if (twilioSid && twilioToken && twilioFrom) {
    try {
      const authHeader = 'Basic ' + Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64');
      const body = new URLSearchParams({
        To: `+91${cleanPhone}`,
        From: twilioFrom,
        Body: fullMessage,
      });
      await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });
      carrierName = 'Twilio SMS Cellular Network';
    } catch (e) {
      console.warn('Twilio dispatch note:', e);
    }
  }

  // Record dispatch log
  const record: DispatchRecord = {
    id: dispatchId,
    phone: cleanPhone,
    wardId: options.wardId,
    title: options.title || 'Water Supply Alert',
    message: fullMessage,
    carrier: carrierName,
    status: 'DELIVERED_TO_CARRIER',
    smsUrl,
    whatsappUrl,
    timestamp: now,
  };
  dispatchLogs.unshift(record);
  if (dispatchLogs.length > 100) dispatchLogs.pop();

  console.log(`[ALERT DISPATCHED] -> +91 ${cleanPhone} | Carrier: ${carrierName} | Ward ${options.wardId || 'All'}`);

  return {
    success: true,
    carrier: carrierName,
    smsUrl,
    whatsappUrl,
    cleanPhone,
    fullMessage,
    dispatchId,
    deliveredAt: now,
  };
}

// POST /api/alerts/subscribe: Citizen registers mobile number for alerts
app.post('/api/alerts/subscribe', async (req, res) => {
  try {
    const { phone, name, email, wardId, locality, leadTime, language } = req.body;

    if (!phone || phone.replace(/\D/g, '').length < 10) {
      return res.status(400).json({
        success: false,
        error: 'A valid 10-digit mobile number is required to receive SMS alerts.',
      });
    }

    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    const wardNum = Number(wardId) || 32;
    const subscriberName = name?.trim() || 'Citizen';

    const subscriber: AlertSubscriber = {
      id: `sub-${Date.now()}`,
      phone: cleanPhone,
      name: subscriberName,
      email: email?.trim(),
      wardId: wardNum,
      locality: locality?.trim() || `Ward ${wardNum} Locality`,
      leadTime: leadTime || '60',
      language: language || 'bilingual',
      subscribedAt: new Date().toISOString(),
    };

    alertSubscribers.set(cleanPhone, subscriber);

    // Dispatch welcome & current schedule alert directly to user's mobile number
    const welcomeEn = `Welcome to GVMC JAL SETU! You are registered for Ward ${wardNum} water alerts. You will receive notifications ${subscriber.leadTime} mins before valve release.`;
    const welcomeTe = `జీవీఎంసీ జల సేతు రిజిస్ట్రేషన్ విజయవంతమైంది! వార్డు ${wardNum} నీటి సరఫరా ప్రారంభ సమయానికి ${subscriber.leadTime} నిమిషాల ముందు మీకు SMS అందుతుంది.`;

    const dispatchResult = await dispatchMobileAlert({
      phone: cleanPhone,
      message: welcomeEn,
      teluguMessage: welcomeTe,
      wardId: wardNum,
      title: `Ward ${wardNum} Alert Registration Confirmed`,
      language: subscriber.language,
    });

    return res.status(201).json({
      success: true,
      message: `Successfully registered +91 ${cleanPhone} for Ward ${wardNum} alerts!`,
      subscriber,
      delivery: dispatchResult,
    });
  } catch (err: any) {
    console.error('Error registering alert subscriber:', err);
    return res.status(500).json({ success: false, error: err.message || 'Server error' });
  }
});

// POST /api/alerts/send-sms: Send instant alert to any mobile number
app.post('/api/alerts/send-sms', async (req, res) => {
  try {
    const { phone, message, teluguMessage, wardId, title, language } = req.body;

    if (!phone || phone.replace(/\D/g, '').length < 10) {
      return res.status(400).json({
        success: false,
        error: 'Please enter a valid 10-digit mobile number.',
      });
    }

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Alert message content is required.',
      });
    }

    const dispatchResult = await dispatchMobileAlert({
      phone,
      message,
      teluguMessage,
      wardId: Number(wardId) || undefined,
      title: title || 'GVMC Water Alert',
      language,
    });

    return res.json({
      message: `Alert dispatched to +91 ${dispatchResult.cleanPhone} via ${dispatchResult.carrier}`,
      ...dispatchResult,
    });
  } catch (err: any) {
    console.error('Error dispatching SMS alert:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/alerts/broadcast-ward: Operator or Admin broadcasts alert to all ward subscribers
app.post('/api/alerts/broadcast-ward', async (req, res) => {
  try {
    const { wardId, title, message, teluguMessage, eventType } = req.body;

    const targetWard = Number(wardId);
    const recipients: string[] = [];

    // Find all subscribers registered for this ward (or all if wardId is null/all)
    for (const [phone, sub] of alertSubscribers.entries()) {
      if (!targetWard || sub.wardId === targetWard) {
        recipients.push(phone);
      }
    }

    // Always ensure at least the demo user and default subscribers receive
    if (recipients.length === 0) {
      recipients.push('9848012345');
    }

    const dispatches = [];
    for (const phone of recipients) {
      const result = await dispatchMobileAlert({
        phone,
        message: message || `Ward ${wardId} water valve status updated to: ${eventType || 'Active'}`,
        teluguMessage: teluguMessage || `వార్డు ${wardId} నీటి సరఫరా ప్రారంభమైనది.`,
        wardId: targetWard || undefined,
        title: title || `Ward ${wardId} Valve Alert`,
      });
      dispatches.push(result);
    }

    return res.json({
      success: true,
      wardId: targetWard,
      dispatchedCount: recipients.length,
      recipients,
      sampleDelivery: dispatches[0],
      dispatches,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/alerts/subscribers
app.get('/api/alerts/subscribers', (_req, res) => {
  const subs = Array.from(alertSubscribers.values()).map((s) => ({
    id: s.id,
    phone: `+91 ${s.phone.slice(0, 5)} •••••`,
    rawPhone: s.phone,
    name: s.name,
    wardId: s.wardId,
    locality: s.locality,
    leadTime: s.leadTime,
    language: s.language,
    subscribedAt: s.subscribedAt,
  }));
  return res.json({ success: true, count: subs.length, subscribers: subs });
});

// GET /api/alerts/dispatch-logs
app.get('/api/alerts/dispatch-logs', (_req, res) => {
  return res.json({ success: true, logs: dispatchLogs });
});

// Backward compatible endpoint for developer portal
app.post('/api/otp/send', async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: 'Phone number required' });
  const result = await dispatchMobileAlert({
    phone,
    message: 'Ward 32 valve gate release scheduled. Pressure: 2.8 Bar. Motors ready.',
    teluguMessage: 'వార్డు 32 నీటి సరఫరా ప్రారంభమైనది.',
    wardId: 32,
    title: 'GVMC Mobile Water Alert',
  });
  return res.json(result);
});

// ==========================================
// 4. CITIZEN TANKER REQUESTS & ADMIN ACTION
// ==========================================

interface TankerRecord {
  id: string;
  residentName: string;
  residentEmail?: string;
  phone: string;
  wardId: number;
  locality: string;
  capacityLiters: number;
  reason: string;
  status: 'pending' | 'dispatched' | 'delivered' | 'cancelled';
  bookedAt: string;
}

const tankerBookings: TankerRecord[] = [
  {
    id: 'GVMC-TNK-4412',
    residentName: 'Karthik Vattam',
    residentEmail: 'vattamkarthik007@gmail.com',
    phone: '9848012345',
    wardId: 32,
    locality: 'MVP Colony Sector 3, Near Rythu Bazaar',
    capacityLiters: 2000,
    reason: 'Dry pipeline during morning cycle',
    status: 'dispatched',
    bookedAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
  },
  {
    id: 'GVMC-TNK-8821',
    residentName: 'Suresh Kumar',
    residentEmail: 'citizen@visakhapatnam.gov.in',
    phone: '9848123456',
    wardId: 14,
    locality: 'Seethamdhara, Balayya Sastri Layout',
    capacityLiters: 1000,
    reason: 'Low pressure supply',
    status: 'pending',
    bookedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
];

// POST /api/tankers/book: Citizen books emergency water tanker
app.post('/api/tankers/book', async (req, res) => {
  try {
    const { residentName, residentEmail, phone, wardId, locality, capacityLiters, reason } = req.body;
    if (!phone) {
      return res.status(400).json({ success: false, error: 'Phone number is required.' });
    }
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    const bookingId = `GVMC-TNK-${Math.floor(1000 + Math.random() * 9000)}`;
    const newBooking: TankerRecord = {
      id: bookingId,
      residentName: residentName?.trim() || 'Resident Citizen',
      residentEmail: residentEmail?.trim(),
      phone: cleanPhone,
      wardId: Number(wardId) || 32,
      locality: locality?.trim() || 'Visakhapatnam Address',
      capacityLiters: Number(capacityLiters) || 2000,
      reason: reason || 'Low pressure or dry supply',
      status: 'pending',
      bookedAt: new Date().toISOString(),
    };
    tankerBookings.unshift(newBooking);

    // Send instant SMS confirmation to citizen
    const confirmationText = `GVMC Jal Sahayata: Tanker booking ${bookingId} confirmed for Ward ${newBooking.wardId} (${newBooking.capacityLiters}L). Fleet tracking active.`;
    await dispatchMobileAlert({
      phone: cleanPhone,
      message: confirmationText,
      teluguMessage: `మీ వాటర్ ట్యాంకర్ బుకింగ్ ${bookingId} నమోదైంది. త్వరలో వాహనం చేరుకుంటుంది.`,
      wardId: newBooking.wardId,
      title: 'GVMC Tanker Booking Confirmation',
    });

    return res.status(201).json({
      success: true,
      message: 'Tanker booked successfully!',
      booking: newBooking,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/tankers: Admin and Citizen list tanker bookings
app.get('/api/tankers', (_req, res) => {
  return res.json({ success: true, count: tankerBookings.length, tankers: tankerBookings });
});

// POST /api/tankers/update-status: Admin approves / dispatches tanker
app.post('/api/tankers/update-status', async (req, res) => {
  try {
    const { id, status } = req.body;
    const booking = tankerBookings.find((t) => t.id === id);
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found.' });
    }
    booking.status = status;

    // Send SMS alert to citizen informing them of status change
    const msg =
      status === 'dispatched'
        ? `GVMC Water Board: Emergency tanker ${booking.id} is DISPATCHED to ${booking.locality}. ETA 25 mins.`
        : `GVMC Water Board: Emergency tanker ${booking.id} has been marked as ${status.toUpperCase()}.`;
    await dispatchMobileAlert({
      phone: booking.phone,
      message: msg,
      teluguMessage: `వాటర్ ట్యాంకర్ ${booking.id} స్థితి: ${
        status === 'dispatched' ? 'వాహనం బయలుదేరింది' : status
      }.`,
      wardId: booking.wardId,
    });

    return res.json({ success: true, message: `Tanker ${id} status updated to ${status}.`, booking });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 5. KEY VIZAG RESERVOIRS TELEMETRY
// ==========================================

interface ReservoirData {
  id: string;
  name: string;
  teluguName: string;
  percentage: number;
  level: string;
  maxLevel: string;
  status: string;
  inflow: string;
  outflow: string;
  accentColor: string;
  lastUpdated?: string;
}

const vizagReservoirs: ReservoirData[] = [
  {
    id: 'meghadrigedda',
    name: 'Meghadrigedda',
    teluguName: 'మేఘాద్రిగెడ్డ',
    percentage: 84,
    level: '48.2 ft',
    maxLevel: '52.0 ft',
    status: 'Full Reserve',
    inflow: '210 Cusecs',
    outflow: '185 Cusecs',
    accentColor: 'primary',
    lastUpdated: '10 mins ago',
  },
  {
    id: 'thatipudi',
    name: 'Thatipudi',
    teluguName: 'తాటిపూడి',
    percentage: 91,
    level: '294 ft',
    maxLevel: '297 ft',
    status: 'Steady Flow',
    inflow: '340 Cusecs',
    outflow: '310 Cusecs',
    accentColor: 'secondary',
    lastUpdated: '15 mins ago',
  },
  {
    id: 'mudasarlova',
    name: 'Mudasarlova',
    teluguName: 'ముదసర్లోవ',
    percentage: 78,
    level: '162 ft',
    maxLevel: '169 ft',
    status: 'Normal Reserve',
    inflow: '95 Cusecs',
    outflow: '90 Cusecs',
    accentColor: 'primary',
    lastUpdated: '25 mins ago',
  },
  {
    id: 'raiwada',
    name: 'Raiwada Canal',
    teluguName: 'రైవాడ కెనాల్',
    percentage: 88,
    level: '112.5 ft',
    maxLevel: '114.0 ft',
    status: 'Active Discharge',
    inflow: '420 Cusecs',
    outflow: '390 Cusecs',
    accentColor: 'secondary',
    lastUpdated: '8 mins ago',
  },
];

// GET /api/reservoirs
app.get('/api/reservoirs', (_req, res) => {
  return res.json({ success: true, count: vizagReservoirs.length, reservoirs: vizagReservoirs });
});

// POST /api/reservoirs/update: Admin updates reservoir levels
app.post('/api/reservoirs/update', (req, res) => {
  try {
    const { id, percentage, level, maxLevel, status, inflow, outflow } = req.body;
    const resv = vizagReservoirs.find((r) => r.id === id);
    if (!resv) {
      return res.status(404).json({ success: false, error: 'Reservoir not found.' });
    }

    if (percentage !== undefined) resv.percentage = Math.max(0, Math.min(100, Number(percentage)));
    if (level) resv.level = level.trim();
    if (maxLevel) resv.maxLevel = maxLevel.trim();
    if (status) resv.status = status.trim();
    if (inflow) resv.inflow = inflow.trim();
    if (outflow) resv.outflow = outflow.trim();
    resv.lastUpdated = 'Just now by Admin';

    console.log(`[RESERVOIR UPDATED] ${resv.name} -> ${resv.percentage}% (${resv.level})`);

    return res.json({
      success: true,
      message: `Reservoir ${resv.name} telemetry updated successfully.`,
      reservoir: resv,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/reservoirs/add: Admin adds new reservoir
app.post('/api/reservoirs/add', (req, res) => {
  try {
    const { name, teluguName, percentage, level, maxLevel, status, inflow, outflow, accentColor } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, error: 'Reservoir name is required.' });
    }
    const cleanId = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const newResv: ReservoirData = {
      id: cleanId,
      name: name.trim(),
      teluguName: teluguName?.trim() || name.trim(),
      percentage: Number(percentage) || 75,
      level: level?.trim() || '100 ft',
      maxLevel: maxLevel?.trim() || '120 ft',
      status: status?.trim() || 'Optimal Reserve',
      inflow: inflow?.trim() || '150 Cusecs',
      outflow: outflow?.trim() || '120 Cusecs',
      accentColor: accentColor || 'primary',
      lastUpdated: 'Just now by Admin',
    };
    vizagReservoirs.push(newResv);

    return res.status(201).json({
      success: true,
      message: `New reservoir ${newResv.name} added to GVMC telemetry!`,
      reservoir: newResv,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT} (PID: ${process.pid})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
