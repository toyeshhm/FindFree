# FindFree Copy System
**Phase 9: Narrative & Micro-Copy**  
**Date:** 2026-06-01  
**Tone:** Warm, direct, neighborhood-human. Like a helpful neighbor, not a startup.

---

## 1. Voice & Tone Principles

**Voice:** Second person. Active verbs. No jargon.  
**Tone:** Warm without being precious. Direct without being cold.  
**Copy test:** Would a helpful neighbor say this? If yes: ship it. If it sounds like a tech company or a charity: rewrite.

| Say this | Not this |
|---|---|
| "Free stuff is nearby" | "Discover items in your area" |
| "Someone wants your old couch" | "Connect with your community" |
| "Couldn't load. Check your connection." | "An error occurred." |
| "Nothing here yet" | "No content available" |
| "Post your first item" | "Get started" |
| "They replied!" | "New message received" |

**Banned words:** Seamless, discover, leverage, utilize, platform, ecosystem, empower, journey (as a noun), solution, experience (as a noun).

**Ellipsis:** Always `…` (U+2026), never `...`.

---

## 2. Emotional Arc (Story Structure Applied to UX)

The three-act structure maps directly to the app's user journey. Every screen belongs to one act. Copy tone shifts accordingly.

### Act 1 — Curiosity → Permission (Splash + Onboarding)
Goal: Remove hesitation. Get the user to the map in under 30 seconds.  
Tone: Warm invitation. No pressure. No feature lists.

### Act 2 — Discovery → Desire → Action (Map + Feed + Detail + Messages)
Goal: Create the "oh wow" moment on the map, then convert it to a message sent.  
Tone: Direct, momentum-building. Celebrate small steps.

### Act 3 — Success → Habit (Post, Claimed, Return)
Goal: Close the loop. Make the user feel the community payoff.  
Tone: Warm, brief, celebratory. Not performative.

---

## 3. Screen-by-Screen Copy

### Splash Screen
```
FIND FREE
─────────────
Free stuff, nearby.
```
No button. Auto-advances after 2.5s. The tagline is the entire pitch.

---

### Onboarding
**Headline:** Free stuff is everywhere.  
**Subheadline:** Now you'll find it.

**Primary CTA:** Create Account  
**Secondary CTA:** Browse Without Signing Up

**Guest mode note (inline, small):** You can browse and view items. Sign up to message posters or save finds.

---

### Sign Up
**Screen title:** Create your account

**Email label:** Email  
**Email placeholder:** you@example.com  
**Password label:** Password  
**Password placeholder:** 8+ characters

**Submit button:** Create Account  
**Sign in link:** Already have one? Sign in

**Error — email taken:** That email is already registered. Sign in instead?  
**Error — weak password:** Use at least 8 characters.  
**Error — network:** Couldn't connect. Check your connection and try again.

---

### Sign In
**Screen title:** Welcome back

**Submit button:** Sign In  
**Forgot password:** Forgot your password?  
**Sign up link:** New here? Create an account

**Error — wrong credentials:** Email or password is incorrect. Try again.

---

### Map Home
**Search bar placeholder:** Search nearby items…

**Filter button label:** Filters  
**Filter sheet title:** Show me items within  
**Radius options:** 1 km / 5 km / 10 km / 25 km / 50 km  
**Category label:** Category (optional)  
**Reset filters:** Clear all  
**Apply button:** Show results

**No items in radius:** Nothing nearby right now.  
*(smaller, secondary)* Try expanding your radius or check back later.

**Location permission denied banner:**  
FindFree works best with your location. [Open Settings]

**Guest FAB label:** Sign Up to Post Items

---

### Item Preview Sheet (bottom sheet on map marker tap)
**Distance label:** [N] km away  
**Time label:** [N] hours ago  
**CTA button:** View Details

**Accessibility label (full):** "[Item title], [N] km away, posted [N] hours ago. Tap to view details."

---

### Feed
**Screen title:** Nearby  
**Search bar placeholder:** Search nearby items…

**Pull-to-refresh hint:** *(none — the action is self-evident)*

**Empty state (no items):**  
Nothing nearby right now.  
*(secondary)* Try expanding your radius — someone might have just posted something.

**Empty state (filtered, no results):**  
No [category] items within [N] km.  
*(secondary)* Clear your filters to see everything.  
**CTA:** Clear Filters

---

### Item Detail
**Save button (unsaved):** Save  
**Save button (saved):** Saved  
**Accessibility label (save):** Save item to favorites  
**Accessibility label (saved):** Remove from favorites

**Primary CTA:** Message Poster

**Posted by label:** Posted by  
**Time label:** [N] hours ago · [N] km away

**Description section header:** About this item

**No photos placeholder:** No photos added

**Related items header:** More nearby

---

### Message Poster (start conversation)
**Screen title:** New Message

**Placeholder:** Introduce yourself and ask about the item…  
**Send button:** Send Message  
**Sent confirmation (inline, brief):** Message sent. You'll hear back soon.

**Error — not signed in:** You need an account to message posters.  
**CTA:** Create Account

---

### Messages Inbox
**Screen title:** Messages  
**Empty state (no conversations):**  
No messages yet.  
*(secondary)* Message a poster to start a conversation.

**Empty state (guest):**  
Sign up to message posters and claim items.  
**CTA:** Create Account

**Unread badge:** *(number only, no label)*

---

### Chat Thread
**Message input placeholder:** Type a message…  
**Send button accessibility label:** Send message

**Loading messages:** Loading conversation…  
**Error loading:** Couldn't load messages. Pull to try again.

**Empty thread (just started):** Say hello and tell them you're interested.

---

### Saved
**Screen title:** Saved  
**Empty state:**  
Nothing saved yet.  
*(secondary)* Tap the save button on any item to keep track of it.

---

### Profile
**Screen title:** Profile  
**Posted items section:** Your Listings  
**Settings section:** Settings

**Empty listings state:**  
You haven't posted anything yet.  
**CTA:** Post Your First Item

---

### Post Item
**Screen title:** Post an Item  
**Title label:** Title  
**Title placeholder:** e.g. Vintage desk lamp  
**Description label:** Description  
**Description placeholder:** Condition, dimensions, anything useful…  
**Category label:** Category  
**Photos label:** Photos (optional, up to 5)  
**Location label:** Pickup location  
**Location helper:** Your approximate area — we won't share your exact address.  
**Submit button:** Post Item

**Success state:**  
Your item is live!  
*(secondary)* Someone nearby might claim it soon.  
**CTA:** View Your Listing

**Error — missing title:** Add a title so people know what you're offering.  
**Error — network:** Couldn't post. Check your connection and try again.

---

### Delete Item (confirmation dialog)
**Title:** Remove this listing?  
**Body:** This will permanently remove your item.  
**Confirm button:** Delete  
**Cancel button:** Keep It

---

### Settings
**Screen title:** Settings  
**Dark mode label:** Dark Mode  
**Notifications label:** Notifications  
**Notification helper:** Get notified when someone messages you.  
**Sign out button:** Sign Out  
**Delete account label:** Delete Account  
**Delete account helper:** This permanently removes your account and all your listings.

---

## 4. Loading & Error Copy Standards

| State | Copy |
|---|---|
| Loading map | Loading map… |
| Loading feed | Loading nearby items… |
| Loading messages | Loading conversation… |
| Saving item | Saving… |
| Sending message | Sending… |
| Posting item | Posting your item… |
| Signing in | Signing in… |
| Creating account | Creating your account… |

**Error format:** What went wrong + how to fix it. Never just the problem.

| Error | Copy |
|---|---|
| No network | Couldn't connect. Check your connection and try again. |
| Location denied | Location access was denied. [Open Settings] |
| Map load fail | Couldn't load the map. Pull to retry. |
| Message fail | Message didn't send. Tap to retry. |
| Generic server error | Something went wrong. Try again in a moment. |

---

## 5. Success States (Closing the Loop)

These are the moments that build habit. Keep them brief and warm. No exclamation marks more than once.

| Action | Success copy |
|---|---|
| Account created | You're in. Start exploring. |
| Item saved | Saved. You can find it in your Saved tab. |
| Message sent | Sent. You'll be notified when they reply. |
| Item posted | Your item is live! |
| Item deleted | Listing removed. |
| Signed out | You've signed out. |

---

## 6. Notification Copy

**New message:** [Name] replied about [item title]  
**First message on your item:** Someone's interested in your [item title]  
**Item saved:** *(no notification — passive action)*  
**Item expiring:** Your listing "[item title]" expires in 3 days. Extend or remove it.

---

## 7. Micro-Copy Anti-Patterns (Banned)

| Banned | Use instead |
|---|---|
| "Get Started" | Specific action: "Browse Items", "Create Account" |
| "Continue" | Specific next step: "Sign In", "Post Item" |
| "Submit" | Action name: "Send", "Post Item", "Save" |
| "Success!" | What succeeded: "Message sent." |
| "Oops!" | Neutral start: "Couldn't load…" |
| "Please try again later." | "Try again in a moment." |
| "Are you sure?" | Specific: "Remove this listing?" |
| "N/A" | Leave blank or say "Not specified" |
| Exclamation marks after errors | Period only |
| All-caps in body copy | Uppercase for labels only |

---

*FindFree COPY.md — Phase 9 complete 2026-06-01.*
