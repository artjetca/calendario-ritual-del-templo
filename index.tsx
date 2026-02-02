import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { Calendar as CalendarIcon, Download, ChevronLeft, ChevronRight, Info, Loader2, X, Image as ImageIcon, Trash2, Upload, FileText, Printer, Share2, Bell, BellRing } from 'lucide-react';
import { LocalNotifications } from '@capacitor/local-notifications';

// --- LUNAR CALENDAR LOGIC (1900-2100) ---
const LUNAR_INFO = [
  0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2,
  0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0, 0x14977,
  0x04970, 0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970,
  0x06566, 0x0d4a0, 0x0ea50, 0x06e95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950,
  0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0b557,
  0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5d0, 0x14573, 0x052d0, 0x0a9a8, 0x0e950, 0x06aa0,
  0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0,
  0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b5a0, 0x195a6,
  0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46, 0x0ab60, 0x09570,
  0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58, 0x055c0, 0x0ab60, 0x096d5, 0x092e0,
  0x0c960, 0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5,
  0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930,
  0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260, 0x0ea65, 0x0d530,
  0x05aa0, 0x076a3, 0x096d0, 0x04bd7, 0x04ad0, 0x0a4d0, 0x1d0b6, 0x0d250, 0x0d520, 0x0dd45,
  0x0b5a0, 0x056d0, 0x055b2, 0x049b0, 0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0,
  0x14b63, 0x09370, 0x049f8, 0x04970, 0x064b0, 0x168a6, 0x0ea50, 0x06b20, 0x1a6c4, 0x0aae0,
  0x0a2e0, 0x0d2e3, 0x0c960, 0x0d557, 0x0d4a0, 0x0da50, 0x05d55, 0x056a0, 0x0a6d0, 0x055d4,
  0x052d0, 0x0a9b8, 0x0a950, 0x0b4a0, 0x0b6a6, 0x0ad50, 0x055a0, 0x0aba4, 0x0a5b0, 0x052b0,
  0x0b273, 0x06930, 0x07337, 0x06aa0, 0x0ad50, 0x14b55, 0x04b60, 0x0a570, 0x054e4, 0x0d160,
  0x0e968, 0x0d520, 0x0daa0, 0x16aa6, 0x056d0, 0x04ae0, 0x0a9d4, 0x0a2d0, 0x0d150, 0x0f252,
  0x0d520
];

// Chinese weekdays for iPhone style
const CHINESE_WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日'];
const SPANISH_WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const SPANISH_MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

// Chinese lunar day names
const CHINESE_LUNAR_DAYS = [
  '', '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
  '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
  '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十'
];

// Chinese lunar month names
const CHINESE_LUNAR_MONTHS = [
  '正月', '二月', '三月', '四月', '五月', '六月',
  '七月', '八月', '九月', '十月', '冬月', '腊月'
];

const SPANISH_LUNAR_MONTHS = [
  'Mes 1', 'Mes 2', 'Mes 3', 'Mes 4', 'Mes 5', 'Mes 6',
  'Mes 7', 'Mes 8', 'Mes 9', 'Mes 10', 'Mes 11', 'Mes 12'
];

const SPANISH_LUNAR_DAYS = [
  '', 'Día 1', 'Día 2', 'Día 3', 'Día 4', 'Día 5', 'Día 6', 'Día 7', 'Día 8', 'Día 9', 'Día 10',
  'Día 11', 'Día 12', 'Día 13', 'Día 14', 'Día 15', 'Día 16', 'Día 17', 'Día 18', 'Día 19', 'Día 20',
  'Día 21', 'Día 22', 'Día 23', 'Día 24', 'Día 25', 'Día 26', 'Día 27', 'Día 28', 'Día 29', 'Día 30'
];

// --- Helper Functions for Lunar Calculation ---
function lunarYearDays(y: number) {
  let i, sum = 348;
  for (i = 0x8000; i > 0x8; i >>= 1) sum += (LUNAR_INFO[y - 1900] & i) ? 1 : 0;
  return (sum + leapDays(y));
}

function leapMonth(y: number) {
  return (LUNAR_INFO[y - 1900] & 0xf);
}

function leapDays(y: number) {
  if (leapMonth(y)) return ((LUNAR_INFO[y - 1900] & 0x10000) ? 30 : 29);
  return (0);
}

function monthDays(y: number, m: number) {
  return ((LUNAR_INFO[y - 1900] & (0x10000 >> m)) ? 30 : 29);
}

function toLunar(date: Date) {
  let i, leap = 0, temp = 0;
  let offset = (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - Date.UTC(1900, 0, 31)) / 86400000;

  for (i = 1900; i < 2101 && offset > 0; i++) {
    temp = lunarYearDays(i);
    offset -= temp;
  }

  if (offset < 0) {
    offset += temp;
    i--;
  }

  const year = i;
  leap = leapMonth(i);
  let isLeap = false;

  for (i = 1; i < 13 && offset > 0; i++) {
    if (leap > 0 && i === (leap + 1) && !isLeap) {
      --i;
      isLeap = true;
      temp = leapDays(year);
    } else {
      temp = monthDays(year, i);
    }
    if (isLeap && i === (leap + 1)) isLeap = false;
    offset -= temp;
  }

  if (offset === 0 && leap > 0 && i === leap + 1) {
    if (isLeap) { isLeap = false; } else { isLeap = true; --i; }
  }
  if (offset < 0) { offset += temp; --i; }

  return { year, month: i, day: offset + 1, isLeap };
}

interface CalendarEvent {
  title: string;
  chinese?: string;
  isMajor: boolean;
  type?: 'moon' | 'ceremony' | 'natalicio' | 'iluminacion' | 'other';
}

// Rules
const EVENT_RULES = [
  { lunarMonth: 0, lunarDay: 1, title: 'Luna Nueva', chinese: '初一', isMajor: false, type: 'moon' },
  { lunarMonth: 0, lunarDay: 15, title: 'Luna Llena', chinese: '十五', isMajor: false, type: 'moon' },
  { lunarMonth: 1, lunarDay: 1, title: 'Año Nuevo Chino', chinese: '大年初一', isMajor: true, type: 'ceremony' },
  { lunarMonth: 3, lunarDay: 15, title: 'Ceremonia de Primavera', chinese: '春季大典', isMajor: true, type: 'ceremony' },
  { lunarMonth: 6, lunarDay: 15, title: 'Ceremonia de Verano', chinese: '夏季大典', isMajor: true, type: 'ceremony' },
  { lunarMonth: 9, lunarDay: 15, title: 'Ceremonia de Otoño', chinese: '秋季大典', isMajor: true, type: 'ceremony' },
  { lunarMonth: 11, lunarDay: 15, title: 'Ceremonia de Invierno', chinese: '冬季大典', isMajor: true, type: 'ceremony' },
  { lunarMonth: 5, lunarDay: 5, title: 'Festival del Bote del Dragón', chinese: '端午節', isMajor: true, type: 'ceremony' },
  { lunarMonth: 8, lunarDay: 15, title: 'Festival de Medio Otoño', chinese: '中秋節', isMajor: true, type: 'ceremony' },
  { lunarMonth: 4, lunarDay: 24, title: 'Nacimiento de LAO TZU SHI 3 reverencias de 9 toques', chinese: '老祖師聖誕 三拜九叩', isMajor: true, type: 'natalicio' },
  { lunarMonth: 2, lunarDay: 2, title: 'Fallecimiento de LAO TZU SHI 3 reverencias de 9 toques', chinese: '老祖師圓寂 三拜九叩', isMajor: true, type: 'iluminacion' },
  { lunarMonth: 7, lunarDay: 19, title: 'Nacimiento de TIEN RAN EN SHI U KO SHOU', chinese: '天然恩師聖誕 五叩首', isMajor: true, type: 'natalicio' },
  { lunarMonth: 8, lunarDay: 15, title: 'Conmemoración de Fallecimiento de Maestro SHI TSUN U KO SHOU', chinese: '追念先師圓寂週年之恩 五叩首', isMajor: true, type: 'iluminacion' },
  { lunarMonth: 8, lunarDay: 28, title: 'Nacimiento de TZI MU TA REN U KO SHOU', chinese: '慈母大人聖誕 五叩首', isMajor: true, type: 'natalicio' },
  { lunarMonth: 2, lunarDay: 23, title: 'Fallecimiento de SHI MU LAO TA REN U KO SHOU', chinese: '師母老大人圓寂 五叩首', isMajor: true, type: 'iluminacion' },
];

function getEventsForDate(lunar: { year: number, month: number, day: number, isLeap: boolean }): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  
  EVENT_RULES.forEach(rule => {
    let match = false;
    if (rule.lunarMonth === 0) {
      if (lunar.day === rule.lunarDay) match = true;
    } else {
      if (lunar.month === rule.lunarMonth && lunar.day === rule.lunarDay && !lunar.isLeap) match = true;
    }
    if (match) {
      let type = rule.type;
      if (!type) {
         if (rule.title.includes('Ceremonia')) type = 'ceremony';
         else if (rule.title.includes('Natalicio') || rule.title.includes('Nacimiento')) type = 'natalicio';
         else if (rule.title.includes('Iluminación') || rule.title.includes('Fallecimiento')) type = 'iluminacion';
         else type = 'other';
      }
      
      events.push({ title: rule.title, chinese: rule.chinese, isMajor: rule.isMajor, type: type as any });
    }
  });

  if (lunar.month === 12 && !lunar.isLeap) {
      const daysInCurrentLunarMonth = monthDays(lunar.year, 12);
      if (lunar.day === daysInCurrentLunarMonth) {
          events.push({ title: 'Nochevieja China', chinese: '除夕', isMajor: true, type: 'ceremony' });
      }
  }

  return events;
}

// --- ICS Generation ---
const generateICS = (year: number) => {
  const newline = '\r\n';
  let icsContent = `BEGIN:VCALENDAR${newline}VERSION:2.0${newline}PRODID:-//TaoistTemple//Calendar//ES${newline}CALSCALE:GREGORIAN${newline}METHOD:PUBLISH${newline}X-WR-CALNAME:Calendario Ritual del Templo ${year}${newline}`;

  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31);

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const lunar = toLunar(d);
    const events = getEventsForDate(lunar);
    
    events.forEach(event => {
      const dateStr = d.toISOString().replace(/[-:]/g, '').split('T')[0];
      const uid = `taoist-${dateStr}-${Math.floor(Math.random() * 100000)}@temple.app`;
      const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      
      icsContent += `BEGIN:VEVENT${newline}UID:${uid}${newline}DTSTAMP:${now}${newline}DTSTART;VALUE=DATE:${dateStr}${newline}SUMMARY:${event.title} ${event.chinese || ''}${newline}DESCRIPTION:Mes Lunar ${lunar.month}, Día ${lunar.day}${newline}TRANSP:TRANSPARENT${newline}BEGIN:VALARM${newline}TRIGGER:-PT4H${newline}ACTION:DISPLAY${newline}DESCRIPTION:Recordatorio: ${event.title} mañana${newline}END:VALARM${newline}END:VEVENT${newline}`;
    });
  }

  icsContent += `END:VCALENDAR`;
  
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute('download', `Calendario_Ritual_${year}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// --- Local Notifications ---
const scheduleNotifications = async (year: number): Promise<{ success: boolean; count: number; error?: string }> => {
  try {
    // Request permission
    const permResult = await LocalNotifications.requestPermissions();
    if (permResult.display !== 'granted') {
      return { success: false, count: 0, error: 'Permiso de notificaciones denegado' };
    }

    // Cancel existing notifications
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel({ notifications: pending.notifications });
    }

    // Collect all events for the year
    const notifications: any[] = [];
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);
    let notificationId = 1;

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const lunar = toLunar(d);
      const events = getEventsForDate(lunar);
      
      // Only schedule for major events (skip regular moon phases to avoid too many notifications)
      const majorEvents = events.filter(e => e.isMajor);
      
      majorEvents.forEach(event => {
        // Schedule notification for 1 day before at 9:00 AM
        const notifyDate = new Date(d);
        notifyDate.setDate(notifyDate.getDate() - 1);
        notifyDate.setHours(9, 0, 0, 0);
        
        // Only schedule future notifications
        if (notifyDate > new Date()) {
          notifications.push({
            id: notificationId++,
            title: '📅 Recordatorio del Templo',
            body: `Mañana: ${event.title}`,
            schedule: { at: notifyDate },
            sound: 'default',
            smallIcon: 'ic_launcher',
            largeIcon: 'ic_launcher',
          });
        }
      });
    }

    // Schedule all notifications
    if (notifications.length > 0) {
      await LocalNotifications.schedule({ notifications });
    }

    return { success: true, count: notifications.length };
  } catch (error: any) {
    console.error('Error scheduling notifications:', error);
    return { success: false, count: 0, error: error.message || 'Error desconocido' };
  }
};

// Check if notifications are enabled
const checkNotificationStatus = async (): Promise<boolean> => {
  try {
    const result = await LocalNotifications.checkPermissions();
    return result.display === 'granted';
  } catch {
    return false;
  }
};

// --- Detect mobile ---
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  
  return isMobile;
};

// --- MOBILE CALENDAR COMPONENT (iPhone Style + Plan D - Spanish) ---
const MobileCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showEventDetail, setShowEventDetail] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationResult, setNotificationResult] = useState<{ success: boolean; count: number; error?: string } | null>(null);
  const [showYearlySummary, setShowYearlySummary] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  
  useEffect(() => {
    const today = new Date();
    setCurrentDate(today);
    
    // Check notification status on load
    checkNotificationStatus().then(setNotificationsEnabled).catch(() => {});
  }, []);
  
  const handleScheduleNotifications = async () => {
    setIsScheduling(true);
    const result = await scheduleNotifications(currentDate.getFullYear());
    setNotificationResult(result);
    setNotificationsEnabled(result.success);
    setIsScheduling(false);
    setShowNotificationModal(true);
  };

  // Get yearly events for summary
  const yearlyEvents = useMemo(() => {
    const year = currentDate.getFullYear();
    const eventsByMonth: Record<number, Array<{date: Date, lunar: any, events: CalendarEvent[]}>> = {};
    
    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31);
    
    for(let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
       const lunar = toLunar(d);
       const evs = getEventsForDate(lunar);
       if(evs.length > 0) {
          const month = d.getMonth();
          if (!eventsByMonth[month]) eventsByMonth[month] = [];
          eventsByMonth[month].push({
              date: new Date(d),
              lunar,
              events: evs
          });
       }
    }
    return eventsByMonth;
  }, [currentDate.getFullYear()]);

  const handleDownloadPDF = () => {
    const element = document.getElementById('mobile-printable-summary');
    if (!element) return;
    
    setIsGeneratingPDF(true);

    const opt = {
      margin: 0, 
      filename: `Calendario_Ritual_${currentDate.getFullYear()}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false }, 
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all'] }
    };

    // @ts-ignore
    if (window.html2pdf) {
        // @ts-ignore
        window.html2pdf().set(opt).from(element).save().then(() => {
            setIsGeneratingPDF(false);
        }).catch((err: any) => {
            console.error("PDF generation failed", err);
            setIsGeneratingPDF(false);
            alert("Error al generar el PDF. Por favor intente de nuevo.");
        });
    } else {
        alert('La librería PDF no está cargada. Por favor recargue la página.');
        setIsGeneratingPDF(false);
    }
  };

  const isToday = (d: Date) => {
    const today = new Date();
    return d.getDate() === today.getDate() && 
           d.getMonth() === today.getMonth() && 
           d.getFullYear() === today.getFullYear();
  };

  const isSelected = (d: Date) => {
    if (!selectedDate) return false;
    return d.getDate() === selectedDate.getDate() && 
           d.getMonth() === selectedDate.getMonth() && 
           d.getFullYear() === selectedDate.getFullYear();
  };

  // Generate calendar for current month
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];
    
    const firstDayIndex = (firstDay.getDay() + 6) % 7;
    
    const prevMonth = new Date(year, month, 0);
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({ 
        date: new Date(year, month - 1, prevMonth.getDate() - i), 
        isCurrentMonth: false 
      });
    }
    
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }
    
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }
    
    return days;
  }, [currentDate]);

  // Get monthly events for the event list card
  const monthlyEvents = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const events: Array<{date: Date, lunar: any, events: CalendarEvent[]}> = [];
    
    const lastDay = new Date(year, month + 1, 0).getDate();
    for (let i = 1; i <= lastDay; i++) {
      const date = new Date(year, month, i);
      const lunar = toLunar(date);
      const dayEvents = getEventsForDate(lunar);
      if (dayEvents.length > 0) {
        events.push({ date, lunar, events: dayEvents });
      }
    }
    return events;
  }, [currentDate]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(null);
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    const lunar = toLunar(date);
    const events = getEventsForDate(lunar);
    if (events.length > 0) {
      setShowEventDetail(true);
    }
  };

  // Get lunar display with icon for events (Spanish)
  const getLunarDisplay = (date: Date) => {
    const lunar = toLunar(date);
    const events = getEventsForDate(lunar);
    
    const moonEvent = events.find(e => e.type === 'moon');
    const ceremonyEvent = events.find(e => e.type === 'ceremony');
    const otherEvent = events.find(e => e.type === 'natalicio' || e.type === 'iluminacion');
    
    let icon = '';
    if (ceremonyEvent) icon = '🔔';
    else if (moonEvent) icon = moonEvent.title.includes('Nueva') ? '🌑' : '🌕';
    else if (otherEvent) icon = otherEvent.type === 'natalicio' ? '🙏' : '✨';
    
    // Spanish lunar display
    let text = lunar.day === 1 ? SPANISH_LUNAR_MONTHS[lunar.month - 1] : SPANISH_LUNAR_DAYS[lunar.day];
    
    return { icon, text, hasEvent: events.length > 0, hasMajor: events.some(e => e.isMajor) };
  };

  // Get event bar color
  const getEventBarColor = (date: Date) => {
    const lunar = toLunar(date);
    const events = getEventsForDate(lunar);
    if (events.length === 0) return null;
    
    const hasCeremony = events.some(e => e.type === 'ceremony');
    const hasNatalicio = events.some(e => e.type === 'natalicio');
    const hasIluminacion = events.some(e => e.type === 'iluminacion');
    const hasMoon = events.some(e => e.type === 'moon' && !events.some(ee => ee.isMajor));
    
    if (hasCeremony) return '#B91C1C';
    if (hasNatalicio) return '#7c3aed';
    if (hasIluminacion) return '#0891b2';
    if (hasMoon) return '#f59e0b';
    return '#10b981';
  };

  const selectedLunar = selectedDate ? toLunar(selectedDate) : null;
  const selectedEvents = selectedLunar ? getEventsForDate(selectedLunar) : [];

  return (
    <div className="min-h-screen bg-[#f5f5f7] flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between safe-area-top">
        <button 
          onClick={() => setCurrentDate(new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), 1))}
          className="text-[#B91C1C] font-medium"
        >
          &lt; {currentDate.getFullYear() - 1}
        </button>
        <h1 className="text-lg font-semibold">Calendario Lunar</h1>
        <button 
          onClick={() => setCurrentDate(new Date(currentDate.getFullYear() + 1, currentDate.getMonth(), 1))}
          className="text-[#B91C1C] font-medium"
        >
          {currentDate.getFullYear() + 1} &gt;
        </button>
      </div>

      {/* Month Title */}
      <div className="px-4 py-3 bg-white border-b border-gray-100">
        <h2 className="text-2xl font-bold text-black">
          {SPANISH_MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Calendario Ritual del Templo
        </p>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 bg-white">
        {SPANISH_WEEKDAYS.map((day, idx) => (
          <div 
            key={day} 
            className={`py-2 text-center text-xs font-medium ${
              idx >= 5 ? 'text-gray-400' : 'text-gray-500'
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="bg-white">
        <div className="grid grid-cols-7 gap-px bg-gray-100">
          {calendarDays.map((item, idx) => {
            const lunarDisplay = getLunarDisplay(item.date);
            const eventBarColor = getEventBarColor(item.date);
            const isWeekend = item.date.getDay() === 0 || item.date.getDay() === 6;
            const todayDate = isToday(item.date);
            const selected = isSelected(item.date);
            
            return (
              <button 
                key={idx}
                onClick={() => handleDateClick(item.date)}
                className={`
                  bg-white flex flex-col items-center pt-1 pb-2 relative min-h-[72px]
                  ${!item.isCurrentMonth ? 'opacity-25' : ''}
                  ${selected ? 'bg-red-50' : ''}
                  active:bg-gray-100
                `}
              >
                {/* Solar Date */}
                <div className={`
                  w-8 h-8 flex items-center justify-center rounded-full text-base font-medium
                  ${todayDate ? 'bg-[#B91C1C] text-white' : ''}
                  ${!todayDate && isWeekend && item.isCurrentMonth ? 'text-gray-400' : ''}
                  ${!todayDate && !isWeekend && item.isCurrentMonth ? 'text-gray-900' : ''}
                  ${selected && !todayDate ? 'ring-2 ring-[#B91C1C]' : ''}
                `}>
                  {item.date.getDate()}
                </div>
                
                {/* Lunar Date with Icon */}
                <div className="flex items-center justify-center gap-0.5 mt-0.5 h-4">
                  {lunarDisplay.icon && (
                    <span className="text-[10px]">{lunarDisplay.icon}</span>
                  )}
                  <span className={`
                    text-[10px] leading-tight
                    ${lunarDisplay.hasMajor ? 'text-[#B91C1C] font-semibold' : ''}
                    ${!lunarDisplay.hasMajor && lunarDisplay.hasEvent ? 'text-gray-700 font-medium' : ''}
                    ${!lunarDisplay.hasEvent ? 'text-gray-400' : ''}
                  `}>
                    {lunarDisplay.text}
                  </span>
                </div>

                {/* Event Bar Indicator */}
                {eventBarColor && item.isCurrentMonth && (
                  <div 
                    className="absolute bottom-0.5 left-1 right-1 h-1 rounded-full"
                    style={{ backgroundColor: eventBarColor }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Month Navigation */}
      <div className="flex justify-between items-center px-4 py-3 bg-white border-t border-gray-100">
        <button 
          onClick={handlePrevMonth}
          className="flex items-center text-[#B91C1C] font-medium"
        >
          <ChevronLeft size={18} />
          <span>{SPANISH_MONTHS[currentDate.getMonth() === 0 ? 11 : currentDate.getMonth() - 1]}</span>
        </button>
        <button 
          onClick={handleNextMonth}
          className="flex items-center text-[#B91C1C] font-medium"
        >
          <span>{SPANISH_MONTHS[currentDate.getMonth() === 11 ? 0 : currentDate.getMonth() + 1]}</span>
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Monthly Events Card */}
      <div className="flex-1 overflow-auto px-4 py-3">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {/* Card Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-[#B91C1C] to-[#dc2626] text-white">
            <h3 className="font-bold text-base flex items-center gap-2">
              <CalendarIcon size={18} />
              Fechas Importantes - {SPANISH_MONTHS[currentDate.getMonth()]}
            </h3>
            <p className="text-xs text-white/80 mt-0.5">
              {monthlyEvents.length} {monthlyEvents.length === 1 ? 'evento' : 'eventos'}
            </p>
          </div>
          
          {/* Events List */}
          <div className="divide-y divide-gray-100">
            {monthlyEvents.length === 0 ? (
              <div className="px-4 py-6 text-center text-gray-400 text-sm">
                No hay eventos importantes este mes
              </div>
            ) : (
              monthlyEvents.map((item, idx) => {
                const mainEvent = item.events.find(e => e.isMajor) || item.events[0];
                const eventColor = getEventBarColor(item.date);
                
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedDate(item.date);
                      setShowEventDetail(true);
                    }}
                    className="w-full px-4 py-3 flex items-start gap-3 active:bg-gray-50 text-left"
                  >
                    {/* Date Badge */}
                    <div 
                      className="w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0"
                      style={{ backgroundColor: eventColor + '15' }}
                    >
                      <span className="text-lg font-bold" style={{ color: eventColor }}>
                        {item.date.getDate()}
                      </span>
                      <span className="text-[9px] text-gray-500">
                        {SPANISH_WEEKDAYS[(item.date.getDay() + 6) % 7]}
                      </span>
                    </div>
                    
                    {/* Event Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-1.5">
                        <span className="text-sm shrink-0">
                          {mainEvent.type === 'moon' && (mainEvent.title.includes('Nueva') ? '🌑' : '🌕')}
                          {mainEvent.type === 'ceremony' && '🔔'}
                          {mainEvent.type === 'natalicio' && '🙏'}
                          {mainEvent.type === 'iluminacion' && '✨'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium leading-tight ${mainEvent.isMajor ? 'text-[#B91C1C]' : 'text-gray-800'}`}>
                            {mainEvent.title}
                          </p>
                        </div>
                      </div>
                      
                      {/* Lunar Info */}
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 rounded text-gray-600">
                          {SPANISH_LUNAR_MONTHS[item.lunar.month - 1]} - {SPANISH_LUNAR_DAYS[item.lunar.day]}
                        </span>
                        {item.events.length > 1 && (
                          <span className="text-[10px] text-gray-400">
                            +{item.events.length - 1} más
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <ChevronRight size={16} className="text-gray-300 shrink-0 mt-3" />
                  </button>
                );
              })
            )}
          </div>
        </div>
        
        {/* Legend */}
        <div className="mt-3 px-2">
          <p className="text-[10px] text-gray-400 mb-2">Leyenda</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px]">
            <span className="flex items-center gap-1">
              <span className="w-3 h-1 rounded-full bg-[#B91C1C]"></span>
              <span className="text-gray-500">Ceremonia</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-1 rounded-full bg-[#7c3aed]"></span>
              <span className="text-gray-500">Natalicio</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-1 rounded-full bg-[#0891b2]"></span>
              <span className="text-gray-500">Conmemoración</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-1 rounded-full bg-[#f59e0b]"></span>
              <span className="text-gray-500">Día 1 / Día 15</span>
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="bg-white border-t border-gray-200 grid grid-cols-4 py-2 safe-area-bottom">
        <button 
          onClick={handleToday}
          className="flex flex-col items-center text-[#B91C1C] py-1"
        >
          <CalendarIcon size={20} />
          <span className="text-[10px] mt-0.5">Hoy</span>
        </button>
        <button 
          onClick={() => setShowYearlySummary(true)}
          className="flex flex-col items-center text-[#B91C1C] py-1"
        >
          <FileText size={20} />
          <span className="text-[10px] mt-0.5">Resumen</span>
        </button>
        <button 
          onClick={handleScheduleNotifications}
          disabled={isScheduling}
          className={`flex flex-col items-center py-1 ${notificationsEnabled ? 'text-green-600' : 'text-[#B91C1C]'}`}
        >
          {isScheduling ? (
            <Loader2 size={20} className="animate-spin" />
          ) : notificationsEnabled ? (
            <BellRing size={20} />
          ) : (
            <Bell size={20} />
          )}
          <span className="text-[10px] mt-0.5">Recordar</span>
        </button>
        <button 
          onClick={() => generateICS(currentDate.getFullYear())}
          className="flex flex-col items-center text-[#B91C1C] py-1"
        >
          <Download size={20} />
          <span className="text-[10px] mt-0.5">Exportar</span>
        </button>
      </div>

      {/* Notification Result Modal */}
      {showNotificationModal && notificationResult && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowNotificationModal(false)}
        >
          <div 
            className="bg-white rounded-2xl w-full max-w-sm overflow-hidden animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            <div className={`p-6 text-center ${notificationResult.success ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center ${notificationResult.success ? 'bg-green-100' : 'bg-red-100'}`}>
                {notificationResult.success ? (
                  <BellRing size={32} className="text-green-600" />
                ) : (
                  <Bell size={32} className="text-red-600" />
                )}
              </div>
              <h3 className={`text-xl font-bold mt-4 ${notificationResult.success ? 'text-green-800' : 'text-red-800'}`}>
                {notificationResult.success ? 'Recordatorios Activados' : 'Error'}
              </h3>
              <p className="text-gray-600 mt-2">
                {notificationResult.success 
                  ? `Se han programado ${notificationResult.count} recordatorios para ${currentDate.getFullYear()}`
                  : notificationResult.error
                }
              </p>
              {notificationResult.success && (
                <p className="text-sm text-gray-500 mt-2">
                  Recibirás una notificación 1 día antes de cada evento importante
                </p>
              )}
            </div>
            <button 
              onClick={() => setShowNotificationModal(false)}
              className="w-full py-4 text-[#B91C1C] font-semibold border-t border-gray-100"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* Event Detail Modal */}
      {showEventDetail && selectedDate && selectedEvents.length > 0 && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-end"
          onClick={() => setShowEventDetail(false)}
        >
          <div 
            className="bg-white w-full rounded-t-2xl max-h-[80vh] overflow-auto animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Handle */}
            <div className="flex justify-center pt-2 pb-1">
              <div className="w-10 h-1 bg-gray-300 rounded-full"></div>
            </div>
            
            {/* Modal Header */}
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {selectedDate.getDate()} de {SPANISH_MONTHS[selectedDate.getMonth()]}
                  </div>
                  <div className="text-base text-[#B91C1C] font-medium mt-0.5">
                    {selectedLunar && `${SPANISH_LUNAR_MONTHS[selectedLunar.month - 1]} - ${SPANISH_LUNAR_DAYS[selectedLunar.day]}`}
                  </div>
                  <div className="text-sm text-gray-500 mt-0.5">
                    Calendario Lunar
                  </div>
                </div>
                <button 
                  onClick={() => setShowEventDetail(false)}
                  className="p-2 -mr-2 text-gray-400"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Events List */}
            <div className="p-4 space-y-3">
              {selectedEvents.map((event, idx) => {
                let bgColor = 'bg-gray-50';
                let borderColor = 'border-gray-200';
                let iconBg = 'bg-gray-100';
                
                if (event.type === 'ceremony') {
                  bgColor = 'bg-red-50';
                  borderColor = 'border-[#B91C1C]';
                  iconBg = 'bg-[#B91C1C]';
                } else if (event.type === 'natalicio') {
                  bgColor = 'bg-purple-50';
                  borderColor = 'border-purple-500';
                  iconBg = 'bg-purple-500';
                } else if (event.type === 'iluminacion') {
                  bgColor = 'bg-cyan-50';
                  borderColor = 'border-cyan-500';
                  iconBg = 'bg-cyan-500';
                } else if (event.type === 'moon') {
                  bgColor = 'bg-amber-50';
                  borderColor = 'border-amber-500';
                  iconBg = 'bg-amber-500';
                }
                
                return (
                  <div 
                    key={idx}
                    className={`p-4 rounded-xl border-l-4 ${bgColor} ${borderColor}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-full ${iconBg} flex items-center justify-center text-white text-lg shrink-0`}>
                        {event.type === 'moon' && (event.title.includes('Nueva') ? '🌑' : '🌕')}
                        {event.type === 'ceremony' && '🔔'}
                        {event.type === 'natalicio' && '🙏'}
                        {event.type === 'iluminacion' && '✨'}
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-gray-900">
                          {event.title}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Safe area padding */}
            <div className="h-6 safe-area-bottom"></div>
          </div>
        </div>
      )}

      {/* Yearly Summary Modal */}
      {showYearlySummary && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col">
          {/* Header */}
          <div className="bg-[#B91C1C] text-white px-4 py-3 flex items-center justify-between safe-area-top">
            <button 
              onClick={() => setShowYearlySummary(false)}
              className="text-white font-medium"
            >
              Cerrar
            </button>
            <h2 className="font-bold text-lg">Resumen {currentDate.getFullYear()}</h2>
            <button 
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
              className="text-white font-medium flex items-center gap-1"
            >
              {isGeneratingPDF ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} />}
              <span>PDF</span>
            </button>
          </div>

          {/* Content - Scrollable container for A4 preview */}
          <div className="flex-1 overflow-auto bg-gray-200 p-2">
            {/* Printable Content - Compact A4 Layout matching desktop */}
            <div id="mobile-printable-summary" className="bg-white mx-auto shadow-lg" style={{ width: '210mm', minHeight: '297mm', padding: '5mm' }}>
              {/* Title */}
              <div className="text-center mb-2 border-b-2 border-[#B91C1C] pb-2">
                <h1 className="text-xl font-bold text-[#B91C1C] uppercase tracking-wider">Calendario Ritual del Templo {currentDate.getFullYear()}</h1>
              </div>

              {/* 3-Column Grid Layout */}
              <div className="grid grid-cols-3 gap-3">
                {Object.entries(yearlyEvents).map(([monthIndex, days]) => (
                  <div key={monthIndex} className="break-inside-avoid border border-gray-200 rounded-lg overflow-hidden flex flex-col shadow-sm h-fit">
                    {/* Month Header */}
                    <div className="bg-[#B91C1C] text-white py-1 px-2 font-bold text-center text-xs uppercase tracking-wide">
                      {SPANISH_MONTHS[Number(monthIndex)]}
                    </div>
                    
                    {/* Events */}
                    <div className="p-1.5 bg-gray-50 flex-1 space-y-1">
                      {(days as Array<{date: Date, lunar: any, events: CalendarEvent[]}>).map((dayItem, dIdx) => {
                        const isWeekend = dayItem.date.getDay() === 0 || dayItem.date.getDay() === 6;
                        
                        return (
                          <div key={dIdx} className="flex gap-1.5 text-[9px] border-b border-gray-200 pb-1 last:border-0 last:pb-0 leading-tight">
                            <div className={`w-4 text-right font-bold shrink-0 ${isWeekend ? 'text-red-600' : 'text-gray-700'}`}>
                              {dayItem.date.getDate()}
                            </div>

                            <div className="flex-1 min-w-0">
                              {dayItem.events.map((ev, eIdx) => (
                                <div key={eIdx} className="flex flex-col items-start mb-0.5 last:mb-0">
                                  <div className="flex items-start gap-1 leading-none w-full">
                                    <span className="shrink-0 text-[9px] w-2.5 text-center">
                                      {ev.type === 'ceremony' && '🔔'}
                                      {ev.type === 'moon' && (ev.title.includes('Nueva') ? '🌑' : '🌕')}
                                      {ev.type === 'natalicio' && '❀'}
                                      {ev.type === 'iluminacion' && '✨'}
                                    </span>
                                    <div className="flex flex-col">
                                      <span className={`whitespace-normal ${ev.isMajor ? 'font-bold text-[#B91C1C]' : 'text-gray-600'}`}>
                                        {ev.title}
                                      </span>
                                      {ev.chinese && (
                                        <div className={`text-[8px] transform scale-95 origin-left ${ev.isMajor ? 'text-red-800/80' : 'text-gray-400'}`}>
                                          {ev.chinese}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="mt-4 pt-2 border-t border-gray-300 text-center text-gray-400 text-[9px]">
                Calendario generado por App del Templo
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .safe-area-top { padding-top: env(safe-area-inset-top); }
        .safe-area-bottom { padding-bottom: env(safe-area-inset-bottom); }
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up { animation: slide-up 0.3s ease-out; }
      `}</style>
    </div>
  );
};

// --- DESKTOP CALENDAR COMPONENT ---
const DesktopCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showYearlySummary, setShowYearlySummary] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [customImages, setCustomImages] = useState<Record<string, string>>(() => {
    try {
      return JSON.parse(localStorage.getItem('temple_calendar_images') || '{}');
    } catch {
      return {};
    }
  });
  
  useEffect(() => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  }, []);

  useEffect(() => {
    localStorage.setItem('temple_calendar_images', JSON.stringify(customImages));
  }, [customImages]);

  const yearlyEvents = useMemo(() => {
    const year = currentDate.getFullYear();
    const eventsByMonth: Record<number, Array<{date: Date, lunar: any, events: CalendarEvent[]}>> = {};
    
    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31);
    
    for(let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
       const lunar = toLunar(d);
       const evs = getEventsForDate(lunar);
       if(evs.length > 0) {
          const month = d.getMonth();
          if (!eventsByMonth[month]) eventsByMonth[month] = [];
          eventsByMonth[month].push({
              date: new Date(d),
              lunar,
              events: evs
          });
       }
    }
    return eventsByMonth;
  }, [currentDate.getFullYear()]);

  const daysInMonth = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const date = new Date(year, month, 1);
    const days = [];
    
    const firstDayStandard = date.getDay();
    const firstDayIndex = (firstDayStandard === 0 ? 7 : firstDayStandard) - 1;

    const prevMonthLastDate = new Date(year, month, 0).getDate();
    
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({ date: new Date(year, month - 1, prevMonthLastDate - i), isCurrentMonth: false });
    }

    while (date.getMonth() === month) {
      days.push({ date: new Date(date), isCurrentMonth: true });
      date.setDate(date.getDate() + 1);
    }

    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }
    return days;
  }, [currentDate]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const key = selectedDate.toISOString().split('T')[0];
        setCustomImages(prev => ({
          ...prev,
          [key]: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    const key = selectedDate.toISOString().split('T')[0];
    setCustomImages(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleDownloadPDF = () => {
    const element = document.getElementById('printable-summary');
    if (!element) return;
    
    setIsGeneratingPDF(true);

    const opt = {
      margin: 0, 
      filename: `Calendario_Ritual_${currentDate.getFullYear()}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false }, 
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all'] }
    };

    // @ts-ignore
    if (window.html2pdf) {
        // @ts-ignore
        window.html2pdf().set(opt).from(element).save().then(() => {
            setIsGeneratingPDF(false);
        }).catch((err: any) => {
            console.error("PDF generation failed", err);
            setIsGeneratingPDF(false);
            alert("Hubo un error al generar el PDF. Por favor intente de nuevo.");
        });
    } else {
        alert('La librería PDF no está cargada. Por favor recargue la página.');
        setIsGeneratingPDF(false);
    }
  };

  const selectedLunar = useMemo(() => toLunar(selectedDate), [selectedDate]);
  const selectedEvents = useMemo(() => getEventsForDate(selectedLunar), [selectedLunar]);
  const selectedDateKey = selectedDate.toISOString().split('T')[0];
  const currentImage = customImages[selectedDateKey];

  const primaryEvent = selectedEvents.find(e => e.isMajor) || selectedEvents[0];

  const isSelected = (d: Date) => 
    d.getDate() === selectedDate.getDate() && 
    d.getMonth() === selectedDate.getMonth() && 
    d.getFullYear() === selectedDate.getFullYear();

  const isToday = (d: Date) => {
    const today = new Date();
    return d.getDate() === today.getDate() && 
           d.getMonth() === today.getMonth() && 
           d.getFullYear() === today.getFullYear();
  };

  const renderGridContent = (date: Date, lunar: any, events: CalendarEvent[]) => {
    const ceremony = events.find(e => e.type === 'ceremony');
    const moon = events.find(e => e.type === 'moon');
    const other = events.find(e => e.type === 'natalicio' || e.type === 'iluminacion');
    
    if (ceremony) {
       return (
         <div className="flex flex-col text-[11px] leading-tight">
            {moon && (
                <div className="text-stone-800 font-bold mb-0.5 flex flex-col items-start">
                   <div className="flex items-center gap-1">
                       <span>{moon.title.includes('Nueva') ? '🌑' : '🌕'}</span>
                       <span>{moon.title}</span>
                   </div>
                   {moon.chinese && <span className="text-[9px] font-normal ml-5 text-stone-500">{moon.chinese}</span>}
                </div>
            )}
            <div className="text-[#B91C1C] font-bold flex flex-col items-start">
                <div className="flex items-start gap-1">
                    <span className="text-[10px] mt-0.5">🔔</span>
                    <span className="leading-tight">{ceremony.title}</span>
                </div>
                {ceremony.chinese && <span className="text-[10px] font-normal ml-3.5">{ceremony.chinese}</span>}
            </div>
         </div>
       );
    }

    if (moon && other) {
        const iconEnd = other.type === 'natalicio' ? '❀' : '✨';
        const iconStart = moon.title.includes('Nueva') ? '🌑' : '🌕';
        const shortOtherTitle = other.title
          .replace('Nacimiento de ', '')
          .replace('Fallecimiento de ', '')
          .replace('Día de Iluminación ', '')
          .replace('Iluminación ', '');
        const displayTitle = shortOtherTitle.length > 20 ? shortOtherTitle.substring(0, 18) + '...' : shortOtherTitle;

        return (
            <div className="text-stone-800 text-[11px] leading-tight">
                <div className="font-bold mb-0.5 text-stone-900 flex flex-col">
                  <div>
                      <span className="mr-1">{iconStart}</span>
                      {moon.title}
                  </div>
                  {moon.chinese && <span className="font-normal text-[9px] ml-4 text-stone-500">{moon.chinese}</span>}
                </div>
                <div className="text-[#B91C1C] border-t border-stone-300 pt-0.5 flex flex-col">
                   <div title={other.title}>
                       {displayTitle} <span className="ml-0.5">{iconEnd}</span>
                   </div>
                   {other.chinese && <span className="text-[9px] text-stone-500">{other.chinese}</span>}
                </div>
            </div>
        );
    }

    if (moon) {
        const icon = moon.title.includes('Nueva') ? '🌑' : '🌕';
        return (
            <div className="font-bold text-stone-800 text-[11px] flex flex-col items-start gap-0">
               <div className="flex items-center gap-1">
                  <span className="text-sm">{icon}</span> <span>{moon.title}</span>
               </div>
               {moon.chinese && <span className="text-[9px] font-normal ml-5 text-stone-500">{moon.chinese}</span>}
            </div>
        );
    }

    if (other) {
        const icon = other.type === 'natalicio' ? '❀' : '✨';
        const shortOtherTitle = other.title.length > 30 ? other.title.substring(0, 28) + '...' : other.title;
        
        return (
            <div className="text-[#c62828] text-[11px] leading-tight flex flex-col">
               <div>
                   <span className="mr-1 font-normal text-stone-500">{icon}</span>
                   <span className="font-medium" title={other.title}>{shortOtherTitle}</span>
               </div>
               {other.chinese && <span className="text-[9px] ml-4 text-stone-500">{other.chinese}</span>}
            </div>
        );
    }

    return <div className="text-stone-400 text-[10px] mt-2"></div>;
  };

  return (
    <div className="min-h-screen bg-[#fdfbf7] text-stone-800 font-serif flex flex-col">
      <style>{`
        #printable-summary { background-color: white; }
        .print-break-inside-avoid { break-inside: avoid; }
      `}</style>
      
      <div className="flex flex-col lg:flex-row h-screen overflow-hidden">
        <div className="flex-1 flex flex-col h-screen overflow-y-auto lg:overflow-hidden border-r border-stone-300">
          <header className="bg-[#B91C1C] text-white p-4 shadow-md z-10">
            <div className="max-w-5xl mx-auto flex flex-wrap justify-between items-center gap-2">
              <h1 className="text-2xl font-bold tracking-wider flex items-center gap-2">
                <CalendarIcon className="w-6 h-6" />
                <span>Calendario Ritual del Templo</span>
              </h1>
              
              <div className="flex items-center gap-2">
                <button onClick={() => setShowYearlySummary(true)} className="flex items-center gap-1 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded text-sm transition">
                  <FileText size={16} /> <span className="hidden sm:inline">Resumen Anual</span>
                </button>
                <button onClick={() => generateICS(currentDate.getFullYear())} className="flex items-center gap-1 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded text-sm transition">
                  <Download size={16} /> <span className="hidden sm:inline">ICS</span>
                </button>
              </div>
            </div>
          </header>

          <div className="flex items-center justify-between p-4 bg-[#f5f0e6] border-b border-stone-300">
             <button onClick={handlePrevMonth} className="p-2 hover:bg-stone-200 rounded-full transition text-stone-600">
               <ChevronLeft size={24} />
             </button>
             <div className="text-center">
               <h2 className="text-3xl font-bold text-stone-800">
                 {SPANISH_MONTHS[currentDate.getMonth()]}
               </h2>
               <p className="text-stone-500 text-lg font-medium">{currentDate.getFullYear()}</p>
             </div>
             <button onClick={handleNextMonth} className="p-2 hover:bg-stone-200 rounded-full transition text-stone-600">
               <ChevronRight size={24} />
             </button>
          </div>

          <div className="grid grid-cols-7 bg-[#e8e4d9] border-b border-stone-300">
            {SPANISH_WEEKDAYS.map(day => (
              <div key={day} className={`py-2 text-center font-bold text-sm ${day === 'Dom' || day === 'Sáb' ? 'text-[#B91C1C]' : 'text-stone-600'}`}>
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 flex-1 auto-rows-fr bg-stone-200 gap-px border-b border-stone-300">
            {daysInMonth.map((item, idx) => {
              const lunar = toLunar(item.date);
              const events = getEventsForDate(lunar);
              const selected = isSelected(item.date);
              const hasCustomImage = customImages[item.date.toISOString().split('T')[0]];
              
              return (
                <button 
                  key={idx} 
                  onClick={() => setSelectedDate(item.date)}
                  className={`
                    relative flex flex-col items-start justify-start p-2 min-h-[90px] lg:min-h-0 transition-all duration-200 overflow-hidden
                    ${!item.isCurrentMonth ? 'bg-stone-50 text-stone-300' : 'bg-white text-stone-800 hover:bg-amber-50'}
                    ${selected ? '!bg-[#fff0f0] ring-4 ring-inset ring-[#B91C1C] z-20 shadow-xl scale-[1.02]' : ''}
                    ${isToday(item.date) && !selected ? 'bg-[#fffde7]' : ''}
                  `}
                >
                  <div className="w-full flex justify-between items-start mb-1 relative z-10">
                     <span className={`text-2xl font-bold leading-none ${item.date.getDay() === 0 || item.date.getDay() === 6 ? 'text-[#c62828]' : ''}`}>
                       {item.date.getDate()}
                     </span>
                     {isToday(item.date) && <span className="text-[10px] bg-[#fbc02d] text-stone-900 px-1 rounded font-bold uppercase">Hoy</span>}
                     {hasCustomImage && !selected && (
                       <div className="absolute top-0 right-0 w-2 h-2 bg-blue-400 rounded-full"></div>
                     )}
                  </div>

                  <div className="w-full text-left mt-1 relative z-10">
                      {renderGridContent(item.date, lunar, events)}
                  </div>

                  {hasCustomImage && (
                      <div className="absolute inset-0 opacity-10 z-0">
                          <img src={hasCustomImage} className="w-full h-full object-cover" alt="" />
                      </div>
                  )}

                </button>
              );
            })}
          </div>
        </div>

        <div className="w-full lg:w-[400px] bg-[#fdfbf7] flex flex-col h-[50vh] lg:h-screen overflow-y-auto border-t lg:border-t-0 lg:border-l border-stone-300 shadow-2xl relative z-20">
           
           <div className="p-6 pb-2 text-center border-b border-stone-200 border-dashed">
              <div className="text-[#c62828] text-xl font-bold mb-1">
                 {SPANISH_WEEKDAYS[(selectedDate.getDay() + 6) % 7]}
              </div>
              <div className="text-8xl font-bold text-stone-900 leading-none tracking-tighter mb-2">
                 {selectedDate.getDate()}
              </div>
              <div className="text-stone-500 text-lg">
                 {SPANISH_MONTHS[selectedDate.getMonth()]} {selectedDate.getFullYear()}
              </div>
           </div>

           <div className="p-6 text-center space-y-6 flex-1 flex flex-col">
              
              <div className="relative border-y-4 border-double border-stone-800 py-4 px-2 bg-[#fdfbf7]">
                  <div className="text-stone-500 text-xs uppercase tracking-widest mb-2 font-bold">Calendario Lunar</div>
                  <div className="text-2xl font-bold text-stone-900 leading-tight">
                      {SPANISH_LUNAR_MONTHS[selectedLunar.month - 1]}
                  </div>
                  <div className="text-4xl font-black text-[#B91C1C] mt-1 leading-tight">
                      {SPANISH_LUNAR_DAYS[selectedLunar.day]}
                  </div>
                  
                  {(selectedLunar.day === 1 || selectedLunar.day === 15) && (
                      <div className="text-[#B91C1C] font-bold text-lg mt-1 tracking-wide">
                          {selectedLunar.day === 1 ? '(Luna Nueva)' : '(Luna Llena)'}
                      </div>
                  )}

                  {selectedLunar.isLeap && <span className="block mt-2 text-sm text-amber-700 font-bold border border-amber-700 rounded-full px-2 py-0.5 mx-auto w-max">Mes Bisiesto</span>}
              </div>

              {primaryEvent && (
                  <div className="bg-stone-100 border border-stone-300 rounded-lg p-3 shadow-sm">
                      <div className="text-lg font-bold text-stone-800">{primaryEvent.title}</div>
                      {primaryEvent.chinese && <div className="text-base text-[#B91C1C] font-medium mt-1">{primaryEvent.chinese}</div>}
                  </div>
              )}

              {selectedEvents.length > 0 && (
                  <div className="space-y-2 text-left">
                     {selectedEvents.filter(e => e !== primaryEvent).map((ev, idx) => (
                       <div key={idx} className={`
                          px-3 py-2 rounded border text-sm flex items-center gap-2
                          ${ev.isMajor ? 'bg-red-50 border-red-100 text-red-800' : 'bg-white border-stone-200 text-stone-600'}
                       `}>
                          <div className={`w-1.5 h-1.5 rounded-full ${ev.isMajor ? 'bg-red-500' : 'bg-stone-400'}`}></div>
                          <div className="flex flex-col">
                              <span className="font-medium">{ev.title}</span>
                              {ev.chinese && <span className="text-xs opacity-75">{ev.chinese}</span>}
                          </div>
                       </div>
                     ))}
                  </div>
              )}
              
              <div className="mt-auto pt-4">
                  <div className="border-2 border-dashed border-stone-300 rounded-lg h-56 flex items-center justify-center relative overflow-hidden group bg-stone-50 transition hover:border-stone-400 hover:bg-stone-100">
                      {currentImage ? (
                          <>
                              <img src={currentImage} alt="Uploaded for date" className="w-full h-full object-contain p-1" />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition flex items-start justify-end p-2">
                                  <button 
                                      onClick={removeImage} 
                                      className="bg-white/90 hover:bg-red-50 text-red-600 p-2 rounded-full shadow-md transform translate-x-10 group-hover:translate-x-0 transition duration-200"
                                      title="Eliminar imagen"
                                  >
                                      <Trash2 size={18} />
                                  </button>
                              </div>
                          </>
                      ) : (
                          <label className="cursor-pointer flex flex-col items-center text-stone-400 hover:text-stone-600 transition w-full h-full justify-center p-4 text-center">
                              <div className="bg-stone-200 p-3 rounded-full mb-3">
                                  <ImageIcon size={24} className="text-stone-500" />
                              </div>
                              <span className="text-sm font-medium text-stone-600">Subir foto del día</span>
                              <span className="text-xs text-stone-400 mt-1">(Ej. Ceremonia, Flores)</span>
                              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                          </label>
                      )}
                  </div>
              </div>

           </div>
        </div>
      </div>
      
      {showYearlySummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-stone-100 w-full max-w-6xl h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden">
              
              <div className="p-4 border-b flex justify-between items-center bg-[#B91C1C] text-white shrink-0">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  <h2 className="font-bold text-xl">Resumen Anual {currentDate.getFullYear()}</h2>
                </div>
                <button onClick={() => setShowYearlySummary(false)} className="hover:bg-white/20 p-1 rounded"><X /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 bg-stone-200/50 flex justify-center">
                  
                  <div id="printable-summary" className="bg-white shadow-xl shrink-0" style={{ width: '210mm', minHeight: '297mm', padding: '5mm' }}>
                      <div className="text-center mb-2 border-b-2 border-[#B91C1C] pb-2">
                        <h1 className="text-xl font-bold text-[#B91C1C] uppercase tracking-wider">Calendario Ritual del Templo {currentDate.getFullYear()}</h1>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        {Object.entries(yearlyEvents).map(([monthIndex, days]) => (
                          <div key={monthIndex} className="break-inside-avoid border border-stone-200 rounded-lg overflow-hidden flex flex-col shadow-sm h-fit">
                            
                            <div className="bg-[#B91C1C] text-white py-1 px-2 font-bold text-center text-xs uppercase tracking-wide">
                              {SPANISH_MONTHS[Number(monthIndex)]}
                            </div>
                            
                            <div className="p-1.5 bg-stone-50 flex-1 space-y-1">
                              {(days as Array<{date: Date, lunar: any, events: CalendarEvent[]}>).map((dayItem, dIdx) => {
                                const isWeekend = dayItem.date.getDay() === 0 || dayItem.date.getDay() === 6;
                                
                                return (
                                  <div key={dIdx} className="flex gap-1.5 text-[9px] border-b border-stone-200 pb-1 last:border-0 last:pb-0 leading-tight">
                                    <div className={`w-4 text-right font-bold shrink-0 ${isWeekend ? 'text-red-600' : 'text-stone-700'}`}>
                                      {dayItem.date.getDate()}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                      {dayItem.events.map((ev, eIdx) => (
                                        <div key={eIdx} className="flex flex-col items-start mb-0.5 last:mb-0">
                                          <div className="flex items-start gap-1 leading-none w-full">
                                              <span className="shrink-0 text-[9px] w-2.5 text-center">
                                                {ev.type === 'ceremony' && '🔔'}
                                                {ev.type === 'moon' && (ev.title.includes('Nueva') ? '🌑' : '🌕')}
                                                {ev.type === 'natalicio' && '❀'}
                                                {ev.type === 'iluminacion' && '✨'}
                                              </span>
                                              <div className="flex flex-col">
                                                  <span className={`whitespace-normal ${ev.isMajor ? 'font-bold text-[#B91C1C]' : 'text-stone-600'}`}>
                                                    {ev.title}
                                                  </span>
                                                  {ev.chinese && (
                                                      <div className={`text-[8px] transform scale-95 origin-left ${ev.isMajor ? 'text-red-800/80' : 'text-stone-400'}`}>
                                                          {ev.chinese}
                                                      </div>
                                                  )}
                                              </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 pt-2 border-t border-stone-300 text-center text-stone-400 text-[9px]">
                         Calendario generado por App del Templo
                      </div>
                  </div>
              </div>

              <div className="p-4 border-t bg-stone-50 flex justify-end gap-3 shrink-0">
                 <button 
                    id="btn-download-pdf"
                    onClick={handleDownloadPDF}
                    disabled={isGeneratingPDF}
                    className={`flex items-center gap-2 bg-stone-800 hover:bg-stone-900 text-white px-4 py-2 rounded shadow transition ${isGeneratingPDF ? 'opacity-70 cursor-not-allowed' : ''}`}
                 >
                    {isGeneratingPDF ? <Loader2 className="animate-spin" size={18} /> : <Printer size={18} />}
                    <span>{isGeneratingPDF ? 'Generando PDF...' : 'Imprimir / Guardar PDF'}</span>
                 </button>
              </div>
          </div>
        </div>
      )}

    </div>
  );
};

// --- MAIN APP ---
const App = () => {
  const isMobile = useIsMobile();
  
  return isMobile ? <MobileCalendar /> : <DesktopCalendar />;
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
