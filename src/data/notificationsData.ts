export interface AppNotification {
  id: string;
  title: string;
  teluguTitle?: string;
  message: string;
  teluguMessage?: string;
  type: 'emergency' | 'schedule' | 'maintenance' | 'reservoir' | 'info';
  target: 'all' | 'ward' | 'zone';
  targetId?: number | string; // e.g. 32 or 'Zone III'
  timestamp: string;
  date: string;
  isRead: boolean;
  isActive: boolean;
  priority: 'critical' | 'high' | 'normal' | 'info';
  source: 'GVMC SCADA' | 'Developer Portal' | 'Field Operator' | 'Emergency Desk';
  actionLabel?: string;
  actionType?: 'view_ward' | 'book_tanker' | 'call_helpline' | 'dismiss';
}

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    title: 'Meghadrigedda Reservoir at 84% - Supply Optimal',
    teluguTitle: 'మేఘాద్రిగెడ్డ రిజర్వాయర్ 84% పూర్తి సామర్థ్యం',
    message: 'Reservoir levels optimal across Visakhapatnam. Uninterrupted supply scheduled for all 8 zones today.',
    teluguMessage: 'నగరంలోని 8 జోన్లలో నిరంతరాయంగా నీటి సరఫరా సజావుగా సాగుతుంది.',
    type: 'reservoir',
    target: 'all',
    timestamp: '10 mins ago',
    date: 'Today, 06:15 AM',
    isRead: false,
    isActive: true,
    priority: 'info',
    source: 'GVMC SCADA',
    actionLabel: 'View Telemetry',
  },
  {
    id: 'notif-2',
    title: 'Ward 14 (Seethamdhara): Valve Opened Successfully',
    teluguTitle: 'వార్డు 14: వాల్వ్ గేట్ విజయవంతంగా తెరవబడింది',
    message: 'Morning valve release is active. Line pressure is at 2.7 Bar. Overhead tank pumping can begin.',
    teluguMessage: 'లైన్ ప్రెజర్ 2.7 బార్ వద్ద స్థిరంగా ఉంది. ఓవర్‌హెడ్ ట్యాంక్ మోటార్లు ఆన్ చేసుకోండి.',
    type: 'schedule',
    target: 'ward',
    targetId: 14,
    timestamp: '25 mins ago',
    date: 'Today, 05:40 AM',
    isRead: false,
    isActive: true,
    priority: 'high',
    source: 'Field Operator',
    actionLabel: 'Check Ward 14',
    actionType: 'view_ward',
  },
  {
    id: 'notif-3',
    title: 'Ward 45 (Gajuwaka): Feeder Pipeline Desiltation',
    teluguTitle: 'వార్డు 45: పైప్‌లైన్ డీసిల్టేషన్ పనులు జరుగుతున్నాయి',
    message: 'Low pressure alert during morning cycle. Emergency tankers stationed at Chaitanya Nagar & High School Rd.',
    teluguMessage: 'అత్యవసర వాటర్ ట్యాంకర్లు సిద్ధంగా ఉన్నాయి.',
    type: 'maintenance',
    target: 'ward',
    targetId: 45,
    timestamp: '45 mins ago',
    date: 'Today, 05:10 AM',
    isRead: false,
    isActive: true,
    priority: 'high',
    source: 'GVMC SCADA',
    actionLabel: 'Book Tanker',
    actionType: 'book_tanker',
  },
  {
    id: 'notif-4',
    title: 'Ward 88 (Pendurthi): Valve Maintenance in Progress',
    teluguTitle: 'వార్డు 88: వాల్వ్ మరమ్మత్తు పనులు',
    message: 'Sub-station pipeline gasket overhaul underway. Restoring pressure expected by 09:30 AM.',
    teluguMessage: 'ఉదయం 9:30 గంటలకల్లా సరఫరా పునరుద్ధరించబడుతుంది.',
    type: 'emergency',
    target: 'ward',
    targetId: 88,
    timestamp: '1 hour ago',
    date: 'Today, 04:30 AM',
    isRead: true,
    isActive: true,
    priority: 'critical',
    source: 'Emergency Desk',
    actionLabel: 'Helpline 1913',
    actionType: 'call_helpline',
  },
];

const STORAGE_KEY = 'vizag_jalalert_notifications_v1';

export function loadStoredNotifications(): AppNotification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to parse notifications from localStorage', e);
  }
  return INITIAL_NOTIFICATIONS;
}

export function saveStoredNotifications(notifs: AppNotification[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifs));
  } catch (e) {
    console.error('Failed to save notifications to localStorage', e);
  }
}
