# VANTAGE Live Streaming - User Guide

## 🚀 Quick Start

### Demo Credentials (Pre-configured)

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@vantage.live` | `@admin@123#` |
| **Host** | `host@vantage.live` | `@host@123#` |
| **User** | `user@vantage.live` | `@user@123#` |

---

## 📋 Complete User Flow

### 1. Sign Up (Create New Account)
1. Go to `http://localhost:3000/signup`
2. Enter your details:
   - Full Name
   - Email Address
   - Password (min 8 characters)
   - Agree to Terms
3. Click **Create Account**
4. You'll be automatically logged in and redirected to Dashboard

### 2. Sign In (Existing Users)
1. Go to `http://localhost:3000/login`
2. Enter your credentials:
   - Use demo credentials above, OR
   - Use the email/password you signed up with
3. Click **Sign In**
4. You'll be redirected to Dashboard

### 3. Create/Start a Meeting
**Option A: Instant Meeting**
1. From Dashboard, click **Start Meeting** (first quick action card)
2. Enter meeting name
3. Configure settings (optional):
   - Description
   - Max participants
   - Password protection
4. Click **Create Room**
5. You'll be redirected to the meeting room

**Option B: Schedule Meeting**
1. From Dashboard, click **Schedule** (second quick action card)
2. Or go to `http://localhost:3000/schedule-room`
3. Fill in:
   - Meeting Name
   - Date & Time
   - Duration
   - Description
4. Click **Schedule Meeting**
5. Meeting appears in your dashboard

### 4. Join a Meeting
1. From Dashboard, find your meeting
2. Click **Join Now** (for active meetings) or **Start Now** (for scheduled)
3. You'll enter the meeting room

### 5. In the Meeting Room

**Controls Available:**
- 🎤 **Mute/Unmute** - Toggle your microphone
- 📹 **Video On/Off** - Toggle your camera
- 🖥️ **Screen Share** - Share your screen
- ✋ **Raise Hand** - Get attention
- 😊 **Reactions** - Send emoji reactions
- 💬 **Chat** - Open chat panel
- 👥 **Participants** - View all participants
- 🔴 **Record** - Start/stop recording
- 📞 **End Meeting** - End for everyone
- 🚪 **Leave** - Leave meeting

**Recording a Meeting:**
1. Click the **Record** button (circle icon)
2. Recording indicator appears with timer
3. Click again to stop recording
4. Recording downloads automatically as `.webm` file

**Ending a Meeting:**
- **Host**: Click **End Meeting** (red button in header) - ends for all participants
- **Participants**: Click **Leave Meeting** - only you leave

### 6. After Meeting
- Recordings are downloaded automatically
- Meeting status changes to "Ended" in dashboard
- View past meetings in the **Past** tab

---

## 🏠 Dashboard Features

### Quick Actions
1. **Start Meeting** - Create instant meeting
2. **Schedule** - Plan future meeting
3. **Join Meeting** - Enter room code
4. **Analytics** - View insights

### Meeting Tabs
- **All** - View all meetings
- **Active** - Currently running meetings
- **Scheduled** - Upcoming meetings
- **Past** - Completed meetings

### Stats Cards
- Total Meetings
- Total Participants
- Hours Streamed
- Engagement Rate

---

## 🔧 Troubleshooting

### Sign In Button Not Working?
1. Check browser console for errors (F12)
2. Ensure JavaScript is enabled
3. Clear browser cache
4. Try incognito/private mode

### Can't Create Meeting?
1. Ensure you're logged in
2. Check if localStorage is enabled
3. Try refreshing the page

### Recording Not Working?
1. Grant browser permissions for media
2. Use Chrome/Edge (best support)
3. Check if enough disk space

### Server Not Starting?
```bash
# From project root
npm run dev
```

Wait for "Ready" message before accessing.

---

## 📱 Keyboard Shortcuts (In Meeting)

| Key | Action |
|-----|--------|
| `M` | Mute/Unmute |
| `V` | Video On/Off |
| `S` | Screen Share |
| `C` | Open Chat |
| `H` | Raise Hand |

---

## 🌐 URLs

- **Home**: `http://localhost:3000`
- **Login**: `http://localhost:3000/login`
- **Signup**: `http://localhost:3000/signup`
- **Dashboard**: `http://localhost:3000/dashboard`
- **Create Room**: `http://localhost:3000/create-room`
- **Schedule Room**: `http://localhost:3000/schedule-room`
- **Join Room**: `http://localhost:3000/join`

---

## ✅ Test Checklist

- [ ] Sign up with new account
- [ ] Sign in with demo credentials
- [ ] Create instant meeting
- [ ] Schedule future meeting
- [ ] Join meeting room
- [ ] Test audio/video controls
- [ ] Test screen sharing
- [ ] Test chat functionality
- [ ] Start recording
- [ ] Stop recording (verify download)
- [ ] End meeting as host
- [ ] View meeting in Past tab

---

**Support**: Check browser console (F12) for any errors during testing.
