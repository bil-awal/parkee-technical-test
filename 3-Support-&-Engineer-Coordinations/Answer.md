# 3) IT Support & Software Engineer - Koordinasi

### Pertanyaan:
Anda menemukan bahwa ada isu kritis yang mempengaruhi sistem production dan memerlukan koordinasi dengan tim support dan engineer. Jelaskan langkah-langkah yang akan Anda ambil untuk mengkoordinasikan penyelesaian masalah ini?

### **Jawaban**:

Saya akan menggunakan **Incident Response Framework** yang praktis dan sesuai dengan business model **Parkee**:

Alur yang akan kita jalankan: **Pertama, saya akan jadi Incident Commander untuk koordinasi keseluruhan.** Tim Support, handle customer complaints yang masuk dan update status page setiap 30 menit - jangan biarkan customer bingung. Sementara tim Engineering, langsung check monitoring dashboard dan logs untuk identify root cause. Kita buat channel Slack/Whatsapp khusus untuk incident ini dan semua update harus di-post disana, jadi semua orang tau progress terkini.

**Kedua, kita bagi tugas berdasarkan expertise masing-masing.** Engineering team fokus di technical debugging - cek apakah ini issue dari recent deployment, database load, atau external service. Kalau perlu rollback, langsung eksekusi dan inform ke semua. Support team, sambil handle customer, tolong catat juga pattern complaints yang masuk - apakah semua user affected atau hanya segment tertentu. QA team siap-siap untuk verify fix begitu Engineering selesai implement solution. Setiap 15 menit kita sync progress di channel, dan setiap jam saya akan update ke management.

**Ketiga, begitu issue resolved, kita langsung masuk fase post-mortem.** Dalam 48 jam ke depan, kita akan duduk bareng untuk review timeline kejadian, root cause analysis pakai 5 Whys, dan yang paling penting - bikin action items untuk prevent hal serupa terulang. Ini bukan tentang nyari siapa yang salah, tapi bagaimana kita improve system dan process kita. Engineering akan update monitoring alerts, Support akan update knowledge base berdasarkan customer feedback, dan kita semua akan update runbook. Intinya, setiap incident adalah learning opportunity untuk bikin tim lebih robust.

#### 1. IMMEDIATE RESPONSE (0-5 menit)

- **Identifikasi severity:** P1 (Critical) / P2 (High) / P3 (Medium)
- **Alert tim via Slack/WhatsApp:** @oncall-engineer @support-lead
- **Buat incident ticket** di Jira/Trello dengan template:
  - Error description & screenshot
  - Affected services/users
  - Time started
  - Initial impact assessment


#### 2. WAR ROOM ACTIVATION (5-15 menit)
**Setup komunikasi:**
- Slack channel: `#incident-[date]-[issue]`
- Google Meet untuk koordinasi real-time

**Tim inti:**
```
- Incident Lead: Koordinator & decision maker
- Engineer: Debug & implement fix  
- Support: Handle customer & update status
- QA: Test & verify fix
```

#### 3. COORDINATE & EXECUTE (15+ menit)

**Pembagian tugas jelas:**
```
SUPPORT TEAM:
- Respond customer complaints
- Update status page setiap 30 menit
- Collect user feedback & patterns

ENGINEERING TEAM:
- Check monitoring (Grafana/Datadog)
- Analyze logs & identify root cause
- Implement fix/rollback
- Deploy & monitor

COMMUNICATION:
- Internal update: Setiap 15 menit
- Customer update: Setiap 30 menit
- Management update: Setiap jam
```

#### 4. RESOLUTION WORKFLOW
```
1. Quick Fix:
   - Hotfix deployment (jika minor)
   - Rollback (jika recent deployment)
   - Scale resources (jika load issue)

2. Verification:
   - QA test critical flows
   - Monitor metrics 30 menit
   - Confirm dengan sample users

3. Documentation:
   - Update incident log
   - Document temporary fix
   - Schedule permanent solution
```

#### 5. POST-INCIDENT (dalam 48 jam)

**Blameless Post-mortem:**
```
Format sederhana:
1. Timeline & Kronologi
2. Root cause (5 Whys)
3. What worked & what didn't
4. Action items:
   - Immediate: Bug fix, monitoring
   - Long-term: Architecture improvement
   - Process: SOP update
```

**Follow-up actions:**
- Share learning di engineering meeting
- Update runbook & monitoring alerts
- Track completion action items

### TOOLS PRAKTIS

**Untuk tim Parkee (50-100 orang):**
```
Communication: Slack/Discord + WhatsApp backup
Monitoring: Grafana/Datadog/New Relic
Ticketing: Jira/Linear/Trello
Status Page: Statuspage.io/Cachet
Documentation: Notion/Confluence
```

### KEY PRINCIPLES
1. **Speed over perfection** - Fix dulu, optimize kemudian
2. **Clear ownership** - Setiap task ada PIC-nya
3. **Over-communicate** - Better too much than too little
4. **No blame culture** - Focus on system, not person
5. **Learn & improve** - Setiap incident = learning opportunity

### METRICS TO TRACK
- **MTTD** (Mean Time To Detect): < 5 menit
- **MTTA** (Mean Time To Acknowledge): < 10 menit  
- **MTTR** (Mean Time To Resolve): < 2 jam untuk P1
- **Customer Impact**: Jumlah user affected
- **Post-mortem completion**: 100% untuk P1/P2

Dengan framework ini, tim **Parkee** dapat menangani production issues secara terstruktur, cepat, dan efektif sambil tetap menjaga komunikasi yang baik dengan semua stakeholder.