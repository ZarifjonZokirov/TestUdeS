const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8453752951:AAHE1xAgjpjM0zl3mK4MKZUccu6vBIWPlXQ';
const ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID || '7877695886';

export interface TelegramResultPayload {
  studentName: string;
  categoryName: string;
  totalQuestions: number;
  correctCount: number;
  scorePercent: number;
  isPassed: boolean;
  terminationReason: 'normal' | 'esc_key' | 'time_expired';
  durationSpentSeconds: number;
  answersBreakdown: Array<{
    questionText: string;
    studentAnswer: any;
    correctAnswer: any;
    isCorrect: boolean;
  }>;
}

export async function sendTelegramTestResult(payload: TelegramResultPayload): Promise<boolean> {
  try {
    const minutes = Math.floor(payload.durationSpentSeconds / 60);
    const seconds = payload.durationSpentSeconds % 60;
    const timeFormatted = `${minutes} daqiqa ${seconds} soniya`;

    const statusEmoji = payload.isPassed ? '✅' : '❌';
    const statusText = payload.isPassed
      ? '✅ IMTIHONDAN O‘TDI (Muvaffaqiyatli)'
      : '❌ YIQILDI (75% dan kam)';

    let terminationText = "O'quvchi o'zi yakunladi";
    if (payload.terminationReason === 'esc_key') {
      terminationText = "⚠️ ESC tugmasi bosildi / Fullscreen tark etildi (5 soniya limit)";
    } else if (payload.terminationReason === 'time_expired') {
      terminationText = "⏳ Test vaqti tugadi";
    }

    const nowStr = new Date().toLocaleString('uz-UZ', {
      timeZone: 'Asia/Tashkent',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    const message = `
🎯 <b>YANGI TEST NATIJASI | TestSayti</b>
━━━━━━━━━━━━━━━━━━━━━━
👤 <b>O'quvchi:</b> ${escapeHtml(payload.studentName)}
📚 <b>Yo'nalish:</b> ${escapeHtml(payload.categoryName)}
📊 <b>Natija:</b> ${payload.correctCount} / ${payload.totalQuestions} ta to'g'ri (<b>${payload.scorePercent}%</b>)
${statusEmoji} <b>Holat:</b> <b>${statusText}</b>
🎯 <b>Minimal o'tish chegarasi:</b> 75%
⏱ <b>Sarflangan vaqt:</b> ${timeFormatted}
🛑 <b>Yakunlanish sababi:</b> ${escapeHtml(terminationText)}
📅 <b>Vaqt:</b> ${nowStr}
━━━━━━━━━━━━━━━━━━━━━━
<i>Xavfsiz backend orqali avtomatik yuborildi</i>
    `.trim();

    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: ADMIN_CHAT_ID,
        text: message,
        parse_mode: 'HTML'
      }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    const data = await response.json();
    if (!data.ok) {
      console.error('Telegram API error:', data);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Failed to send Telegram notification:', error);
    return false;
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
