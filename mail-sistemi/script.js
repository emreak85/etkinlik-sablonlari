    // ========== CONFIG ==========
    // Client ID'lerini buraya girin (tek seferlik)
    const GOOGLE_CLIENT_ID = '696441981701-nvlec8kker19h48bcv4tcmrm0jg0u4vs.apps.googleusercontent.com';
    // Imgur kaldırıldı — görsel URL olarak girilecek

    // ========== STATE ==========
    let recipients = JSON.parse(localStorage.getItem('mailSistemi_recipients') || '[]');
    let accessToken = null;
    let gmailUserEmail = '';
    let currentImageHostedUrl = null;
    let tokenClient = null;

    // ========== INIT ==========
    window.addEventListener('DOMContentLoaded', () => {
      renderRecipients();
      restoreSession();
      handleImageUrl();
      updatePreview();

      // Set default date/time
      const now = new Date();
      document.getElementById('eventDate').value = now.toISOString().split('T')[0];
      document.getElementById('eventTime').value = '20:00';
      updatePreview();
    });

    function restoreSession() {
      const saved = sessionStorage.getItem('mailSistemi_gmail');
      if (!saved) return;
      try {
        const data = JSON.parse(saved);
        accessToken = data.token;
        gmailUserEmail = data.email;
        document.getElementById('gmailEmail').textContent = gmailUserEmail;
        document.getElementById('gmailNotConnected').style.display = 'none';
        document.getElementById('gmailConnected').style.display = 'block';
      } catch (e) {
        sessionStorage.removeItem('mailSistemi_gmail');
      }
    }

    function saveSession() {
      sessionStorage.setItem('mailSistemi_gmail', JSON.stringify({
        token: accessToken,
        email: gmailUserEmail
      }));
    }

    function clearSession() {
      sessionStorage.removeItem('mailSistemi_gmail');
    }

    // ========== SECTION TOGGLE ==========
    function toggleSection(sectionOrId) {
      const section = typeof sectionOrId === 'string' ? document.getElementById(sectionOrId) : sectionOrId;
      section.classList.toggle('collapsed');
    }

    // ========== GMAIL AUTH ==========
    function gmailSignIn() {
      if (!GOOGLE_CLIENT_ID) {
        showToast('GOOGLE_CLIENT_ID tanımlı değil. index.html dosyasındaki CONFIG bölümünü düzenleyin.', 'error');
        return;
      }

      tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/userinfo.email',
        callback: async (tokenResponse) => {
          if (tokenResponse.error) {
            showToast('Gmail girişi başarısız: ' + tokenResponse.error, 'error');
            return;
          }
          accessToken = tokenResponse.access_token;

          // Get user email
          try {
            const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
              headers: { 'Authorization': 'Bearer ' + accessToken }
            });
            const data = await res.json();
            gmailUserEmail = data.email;
            document.getElementById('gmailEmail').textContent = gmailUserEmail;
            document.getElementById('gmailNotConnected').style.display = 'none';
            document.getElementById('gmailConnected').style.display = 'block';
            saveSession();
            showToast('Gmail hesabı bağlandı.', 'success');
          } catch (e) {
            showToast('Kullanıcı bilgisi alınamadı.', 'error');
          }
        }
      });

      tokenClient.requestAccessToken();
    }

    function gmailSignOut() {
      if (accessToken) {
        google.accounts.oauth2.revoke(accessToken);
      }
      accessToken = null;
      gmailUserEmail = '';
      document.getElementById('gmailNotConnected').style.display = 'block';
      document.getElementById('gmailConnected').style.display = 'none';
      clearSession();
      showToast('Gmail bağlantısı kesildi.', 'info');
    }

    // ========== IMAGE HANDLING ==========
    function handleImageUrl() {
      const url = document.getElementById('imageUrl').value.trim();
      if (url) {
        currentImageHostedUrl = url;
        document.getElementById('imagePreviewThumb').src = url;
        document.getElementById('imagePreviewContainer').style.display = 'block';
        updatePreview();
      } else {
        currentImageHostedUrl = null;
        document.getElementById('imagePreviewContainer').style.display = 'none';
        updatePreview();
      }
    }

    // ========== RECIPIENTS ==========
    function addRecipient() {
      const input = document.getElementById('recipientInput');
      const email = input.value.trim().toLowerCase();
      if (!email) return;
      if (!isValidEmail(email)) {
        showToast('Geçersiz email adresi.', 'error');
        return;
      }
      if (recipients.includes(email)) {
        showToast('Bu email zaten ekli.', 'info');
        input.value = '';
        return;
      }
      recipients.push(email);
      saveRecipients();
      renderRecipients();
      input.value = '';
      input.focus();
    }

    function removeRecipient(email) {
      recipients = recipients.filter(r => r !== email);
      saveRecipients();
      renderRecipients();
    }

    function addBulkRecipients() {
      const text = document.getElementById('bulkEmails').value;
      const emails = text.split(/[,;\n]+/).map(e => e.trim().toLowerCase()).filter(e => e && isValidEmail(e));
      let added = 0;
      emails.forEach(email => {
        if (!recipients.includes(email)) {
          recipients.push(email);
          added++;
        }
      });
      saveRecipients();
      renderRecipients();
      document.getElementById('bulkEmails').value = '';
      showToast(added + ' email eklendi.', 'success');
    }

    function clearRecipients() {
      if (!confirm('Tüm alıcıları silmek istediğinize emin misiniz?')) return;
      recipients = [];
      saveRecipients();
      renderRecipients();
    }

    function exportRecipients() {
      if (recipients.length === 0) {
        showToast('Dışa aktarılacak alıcı yok.', 'info');
        return;
      }
      const text = recipients.join('\n');
      navigator.clipboard.writeText(text).then(() => {
        showToast('Alıcı listesi panoya kopyalandı.', 'success');
      });
    }

    function saveRecipients() {
      localStorage.setItem('mailSistemi_recipients', JSON.stringify(recipients));
    }

    function renderRecipients() {
      const container = document.getElementById('recipientTags');
      container.innerHTML = recipients.map(email =>
        `<div class="recipient-tag">
          <span>${escapeHtml(email)}</span>
          <button onclick="removeRecipient('${escapeHtml(email)}')" title="Kaldır"><i class="fa-solid fa-xmark"></i></button>
        </div>`
      ).join('');
      document.getElementById('recipientCount').textContent = recipients.length > 0
        ? recipients.length + ' alıcı'
        : '';
    }

    function isValidEmail(email) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    // ========== EMAIL TEMPLATE ==========
    function formatDateTR(dateStr) {
      if (!dateStr) return '';
      const d = new Date(dateStr + 'T00:00:00');
      const gunler = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
      const aylar = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
      return `${d.getDate()} ${aylar[d.getMonth()]} ${d.getFullYear()}<br>${gunler[d.getDay()]}`;
    }

    // Asset base URL — preview ve gönderimde doğru yol için
    function getAssetBase() {
      // Yerleşik URL API'si ile klasör yolunu her ortamda güvenli şekilde çekiyoruz
      return new URL('.', window.location.href).href + 'assets';
    }

    function generateEmailHTML(opts = {}) {
      const greeting = opts.greeting || '';
      const date = opts.date || '';
      const time = opts.time || '';
      const location = opts.location || '';
      const imageUrl = opts.imageUrl || '';
      const assetBase = opts.assetBase || getAssetBase();

      const dateFormatted = formatDateTR(date);
      const greetingHtml = escapeHtml(greeting).replace(/\n/g, '<br>');

      const fontFamily = "'Google Sans', Arial, Helvetica, sans-serif";

      const fsmLogoUrl = assetBase + '/fsm-logo.svg';
      const calendarIconUrl = assetBase + '/icon-calendar.svg';
      const clockIconUrl = assetBase + '/icon-clock.svg';
      const pinIconUrl = assetBase + '/icon-pin.svg';

      const socialIcons = [
        { file: 'sosyal-medya-4.svg', alt: 'Dergipark', url: 'https://fsm.edu.tr' },
        { file: 'sosyal-medya-2.svg', alt: 'X', url: 'https://fsm.edu.tr' },
        { file: 'sosyal-medya-3.svg', alt: 'Facebook', url: 'https://fsm.edu.tr' },
        { file: 'sosyal-medya-1.svg', alt: 'Instagram', url: 'https://fsm.edu.tr' },
        { file: 'sosyal-medya-5.svg', alt: 'YouTube', url: 'https://fsm.edu.tr' }
      ];
      const socialIconsHtml = socialIcons.map(s =>
        `<a href="${s.url}" target="_blank" style="display:inline-block; margin:0 4px; transition:opacity 0.2s, transform 0.2s;" onmouseover="this.style.opacity='0.7';this.style.transform='scale(1.15)'" onmouseout="this.style.opacity='1';this.style.transform='scale(1)'"><img src="${assetBase}/${s.file}" width="28" height="28" alt="${s.alt}" style="display:block; border:0;"></a>`
      ).join('');

      let imageSection = '';
      if (imageUrl) {
        imageSection = `
        <tr>
          <td style="padding: 20px 57px 30px 57px;">
            <img src="${escapeHtml(imageUrl)}" width="486" style="display:block; width:100%; max-width:486px; border-radius:14px; margin:0 auto;" alt="Etkinlik Görseli">
          </td>
        </tr>`;
      }

      return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;700&display=swap" rel="stylesheet">
</head>
<body style="margin:0; padding:0; background-color:#f0f2f5; font-family:${fontFamily};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f2f5;">
<tr><td align="center" style="padding:20px 0;">

<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:25px; overflow:hidden; box-shadow:0 0 17px 2px rgba(0,101,128,0.09);">

  <!-- HEADER -->
  <tr>
    <td style="background-color:#006580; padding:0 58px 0 54px; height:160px; vertical-align:middle;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td width="146" valign="middle">
            <img src="${fsmLogoUrl}" width="146" style="display:block;" alt="FSM Logo">
          </td>
          <td valign="middle" style="text-align:right; color:#ffffff; font-family:${fontFamily}; font-size:15px; font-weight:bold; line-height:1.4;">
            KURUMSAL İLETİŞİM VE<br>TANITIM DİREKTÖRLÜĞÜ
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- ACCENT STRIPE -->
  <tr><td style="background-color:#0085a9; height:10px; font-size:0; line-height:0;">&nbsp;</td></tr>

  <!-- GREETING TEXT -->
  <tr>
    <td style="padding:30px 57px 10px 57px; font-family:${fontFamily}; font-size:15px; color:#000000; line-height:1.6;">
      ${greetingHtml}
    </td>
  </tr>

  <!-- INFO CARDS -->
  <tr>
    <td style="padding:15px 57px 20px 57px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td width="33%" valign="top" height="95" style="padding-right:8px; height:95px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" height="95" style="background-color:#f1f5f9; border:1px solid #e1eaef; border-radius:14px; height:95px; table-layout:fixed;">
              <tr style="height:95px;"><td align="center" valign="top" height="95" style="padding:20px 10px 0 10px; height:95px; overflow:hidden;">
                <img src="${calendarIconUrl}" width="25" height="25" alt="Tarih" style="display:block; margin:0 auto 13px auto;">
                <div style="font-family:${fontFamily}; font-size:14px; font-weight:bold; color:#000000; line-height:1.4;">
                  ${dateFormatted || '<span style="color:#ccc;">Tarih</span>'}
                </div>
              </td></tr>
            </table>
          </td>
          <td width="33%" valign="top" height="95" style="padding:0 4px; height:95px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" height="95" style="background-color:#f1f5f9; border:1px solid #e1eaef; border-radius:14px; height:95px; table-layout:fixed;">
              <tr style="height:95px;"><td align="center" valign="top" height="95" style="padding:20px 10px 0 10px; height:95px; overflow:hidden;">
                <img src="${clockIconUrl}" width="25" height="25" alt="Saat" style="display:block; margin:0 auto 13px auto;">
                <div style="font-family:${fontFamily}; font-size:14px; font-weight:bold; color:#000000; line-height:1.4;">
                  ${time ? escapeHtml(time) : '<span style="color:#ccc;">Saat</span>'}
                </div>
              </td></tr>
            </table>
          </td>
          <td width="33%" valign="top" height="95" style="padding-left:8px; height:95px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" height="95" style="background-color:#f1f5f9; border:1px solid #e1eaef; border-radius:14px; height:95px; table-layout:fixed;">
              <tr style="height:95px;"><td align="center" valign="top" height="95" style="padding:20px 10px 0 10px; height:95px; overflow:hidden;">
                <img src="${pinIconUrl}" width="20" height="25" alt="Yer" style="display:block; margin:0 auto 13px auto;">
                <div style="font-family:${fontFamily}; font-size:14px; font-weight:bold; color:#000000; line-height:1.4;">
                  ${location ? escapeHtml(location) : '<span style="color:#ccc;">Yer</span>'}
                </div>
              </td></tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- EVENT IMAGE -->
  ${imageSection}

  <!-- FOOTER SOCIAL -->
  <tr>
    <td align="center" style="padding:20px 57px 10px 57px;">
      ${socialIconsHtml}
    </td>
  </tr>

  <!-- FOOTER TEXT -->
  <tr>
    <td align="center" style="padding:10px 57px 30px 57px; font-family:${fontFamily}; font-size:10px; color:#006580; letter-spacing:1.6px; text-transform:uppercase;">
      KURUMSAL İLETİŞİM VE TANITIM DİREKTÖRLÜĞÜ
    </td>
  </tr>

</table>

</td></tr>
</table>
</body>
</html>`;
    }

    // ========== PREVIEW ==========
    function updatePreview() {
      const greeting = document.getElementById('greetingText').value;
      const date = document.getElementById('eventDate').value;
      const time = document.getElementById('eventTime').value;
      const location = document.getElementById('eventLocation').value;
      const imageUrl = currentImageHostedUrl || '';

      const html = generateEmailHTML({ greeting, date, time, location, imageUrl });

      const iframe = document.getElementById('emailPreview');
      iframe.srcdoc = html;

      // Auto-resize iframe height to content
      iframe.onload = () => {
        const body = iframe.contentDocument && iframe.contentDocument.body;
        if (body) {
          iframe.style.height = body.scrollHeight + 'px';
          
          // İçerikteki resimler sonradan yüklenirse (Live server cache'siz çalışır) yüksekliği dinamik güncelle
          if (!iframe._resizeObserver) {
            iframe._resizeObserver = new ResizeObserver(() => {
              if (iframe.contentDocument && iframe.contentDocument.body) {
                iframe.style.height = iframe.contentDocument.body.scrollHeight + 'px';
              }
            });
          }
          iframe._resizeObserver.disconnect();
          iframe._resizeObserver.observe(body);
        }
      };
    }

    // ========== SEND EMAILS ==========
    async function sendEmails() {
      // Validations
      if (!accessToken) {
        showToast('Önce Gmail ile giriş yapın.', 'error');
        return;
      }
      if (recipients.length === 0) {
        showToast('En az bir alıcı ekleyin.', 'error');
        return;
      }
      const subject = document.getElementById('emailSubject').value.trim();
      if (!subject) {
        showToast('Email konusu girin.', 'error');
        return;
      }

      const sendBtn = document.getElementById('sendBtn');
      sendBtn.disabled = true;

      const imageUrl = currentImageHostedUrl || '';

      // Generate email HTML
      const greeting = document.getElementById('greetingText').value;
      const date = document.getElementById('eventDate').value;
      const time = document.getElementById('eventTime').value;
      const location = document.getElementById('eventLocation').value;
      const emailHTML = generateEmailHTML({ greeting, date, time, location, imageUrl, assetBase: 'https://emreak.art/mail-sistemi/assets' });

      // Show progress
      const progressEl = document.getElementById('sendProgress');
      const progressBar = document.getElementById('progressBarFill');
      const progressText = document.getElementById('progressText');
      progressEl.classList.add('active');

      let sent = 0;
      let failed = 0;

      for (let i = 0; i < recipients.length; i++) {
        const to = recipients[i];
        progressText.textContent = `Gönderiliyor... ${i + 1}/${recipients.length}`;
        progressBar.style.width = ((i + 1) / recipients.length * 100) + '%';

        try {
          await sendSingleEmail(to, subject, emailHTML);
          sent++;
        } catch (e) {
          failed++;
          console.error('Email gönderilemedi:', to, e);

          // Token expired? Try to refresh
          if (e.status === 401 && tokenClient) {
            try {
              await new Promise((resolve, reject) => {
                tokenClient.callback = (resp) => {
                  if (resp.error) reject(resp.error);
                  accessToken = resp.access_token;
                  resolve();
                };
                tokenClient.requestAccessToken();
              });
              // Retry
              await sendSingleEmail(to, subject, emailHTML);
              sent++;
              failed--;
            } catch (retryErr) {
              console.error('Retry failed:', to, retryErr);
            }
          }
        }

        // Wait between sends to avoid rate limiting
        if (i < recipients.length - 1) {
          await sleep(1000);
        }
      }

      progressText.textContent = `Tamamlandı! ${sent} gönderildi` + (failed > 0 ? `, ${failed} başarısız` : '');
      sendBtn.disabled = false;

      if (failed === 0) {
        showToast(`${sent} email başarıyla gönderildi!`, 'success');
      } else {
        showToast(`${sent} gönderildi, ${failed} başarısız.`, 'error');
      }

      // Hide progress after a delay
      setTimeout(() => {
        progressEl.classList.remove('active');
        progressBar.style.width = '0';
      }, 5000);
    }

    async function sendSingleEmail(to, subject, htmlBody) {
      const mimeMessage = createMimeMessage(to, subject, htmlBody);

      const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + accessToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ raw: mimeMessage })
      });

      if (!res.ok) {
        const err = { status: res.status, message: await res.text() };
        throw err;
      }

      return res.json();
    }

    function createMimeMessage(to, subject, htmlBody) {
      // Encode subject as UTF-8 Base64
      const encodedSubject = '=?UTF-8?B?' + utf8ToBase64(subject) + '?=';

      const boundary = 'boundary_' + Date.now();
      const mimeLines = [
        'MIME-Version: 1.0',
        `To: ${to}`,
        `Subject: ${encodedSubject}`,
        `Content-Type: multipart/alternative; boundary="${boundary}"`,
        '',
        `--${boundary}`,
        'Content-Type: text/html; charset=UTF-8',
        'Content-Transfer-Encoding: base64',
        '',
        utf8ToBase64(htmlBody),
        `--${boundary}--`
      ];

      const raw = mimeLines.join('\r\n');
      return btoa(unescape(encodeURIComponent(raw)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
    }

    function utf8ToBase64(str) {
      return btoa(unescape(encodeURIComponent(str)));
    }

    // ========== UTILITIES ==========
    function escapeHtml(str) {
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    }

    function sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    function showToast(message, type = 'info') {
      const container = document.getElementById('toastContainer');
      const toast = document.createElement('div');
      toast.className = 'toast ' + type;
      toast.textContent = message;
      container.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
    }

    function copyEmailHTML() {
      const greeting = document.getElementById('greetingText').value;
      const date = document.getElementById('eventDate').value;
      const time = document.getElementById('eventTime').value;
      const location = document.getElementById('eventLocation').value;
      const imageUrl = currentImageHostedUrl || '';
      const html = generateEmailHTML({ greeting, date, time, location, imageUrl, assetBase: 'https://emreak.art/mail-sistemi/assets' });
      navigator.clipboard.writeText(html).then(() => {
        showToast('Email HTML panoya kopyalandı.', 'success');
      });
    }

    function openHelp() {
      document.getElementById('helpModal').classList.add('active');
    }

    function closeHelp() {
      document.getElementById('helpModal').classList.remove('active');
    }

    // Close modal on overlay click
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal-overlay')) {
        e.target.classList.remove('active');
      }
    });
