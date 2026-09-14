# Atlet: Basketball Shot Tracking App — Design

Date: 2026-09-14
Status: Approved

## 1. Overview

Atlet is an iPhone app. It tracks basketball shooting practice. A user sets up
a phone on a tripod. The user does a short calibration. Then the user shoots
freely. The app counts shots taken and shots made, live, on screen.

This is a personal hobby project first. It may become an app for other users
later.

## 2. Goals

- Track shots taken and shots made, live, during a shooting session.
- Work with an easy phone setup: a simple tripod, on the sideline or in a
  corner of the half-court.
- Let the user pick a target shot count, or shoot freely with no set end.
- Let the user choose to record video, or track only.
- Keep a local history of past sessions.

## 3. Non-Goals (Out of Scope for Version 1)

- Android support. React Native keeps this option open for later, but
  version 1 targets iPhone only.
- Auto hoop detection. The user taps the rim by hand instead.
- Server-side features: accounts, shared stats, leaderboards.
- Release-based shot detection (tracking the shooter's hands and body pose).
  Version 1 uses the simpler trajectory-based rule instead.

## 4. Platform and Tech Stack

- **App shell:** React Native, in TypeScript. This covers UI, the calibration
  flow, shot logic, session state, and stats.
- **Camera:** the `react-native-vision-camera` library. It gives fast, direct
  camera access. It supports live frame processing and video recording at
  the same time.
- **ML detection:** a small native Swift plugin, using Apple's Vision and
  Core ML tools. This plugin finds the ball's position in each camera frame,
  and returns coordinates to the TypeScript side. All ML work runs on the
  phone. No server is needed for tracking.

## 5. Camera Setup

- The user places the phone on a simple tripod, on the sideline or in a
  corner of the half-court. The user does not need to stand behind the hoop.
- The app uses the 0.5x (ultra-wide) lens, to capture a wide view of the
  court.
- The app finds the shooter inside that wide view. The app then crops and
  zooms in software, to keep the shooter centered on screen. The phone
  itself does not move. This mirrors the "Center Stage" effect used in
  FaceTime, but built for the rear camera, so it works on more iPhone
  models.

## 6. Calibration Flow

1. The user opens the live camera preview.
2. The user taps the rim on screen, to mark the hoop zone.
3. The user shoots one free throw, as a calibration shot. The app tracks
   the ball through this shot. This confirms the app can follow the ball
   well, under the current lighting and ball color.
4. The app shows "Calibration complete." The user can now start a real
   session.

If the app cannot track the ball well during the calibration shot, it asks
the user to try again.

## 7. Live Tracking and Shot Detection

- Each camera frame goes through the Swift plugin, which finds the ball's
  position.
- The TypeScript side tracks these positions over time, as a path.
- A **shot attempt** is counted when the ball's path forms an upward arc,
  then a downward arc, moving toward the marked rim zone.
- A **made shot** is counted when two signals line up together:
  - The ball's on-screen position lands inside the rim zone, while moving
    down.
  - The net shows visible movement, at the same time.
- The app draws boxes on screen, around the shooter, the ball, and the rim.
  This lets the user see the tracking working live.

## 8. Session Modes

Before starting a session, the user picks:

- A target shot count, or free shooting with no set end point.
- **Track only** (no saved video), or **track and record** (the app also
  saves the video, for later review).

## 9. Local Stats Storage

The app keeps a local record of every session, stored on the phone only.
Each session record holds:

- Date
- Time
- Shot attempts (count)
- Shots made (count)

The app shows this as a simple table of past sessions. No server or account
is needed to see this history.

## 10. Data Flow

```
Camera
  -> Swift plugin (Core ML / Vision, finds ball position)
  -> coordinates sent to TypeScript
  -> TypeScript tracks the path, checks shot/make rules
  -> UI updates the live count and draws overlay boxes
  -> on session end, session record saved to local storage
```

## 11. Error Handling (Version 1 Scope)

- If the ball is lost for a few frames (blocked by a player, motion blur),
  the app uses the last known path to guess forward a short time. If the
  ball does not reappear near the rim, the app drops that shot attempt.
- If more than one person is in frame, the app tracks the person closest to
  where calibration happened, and treats that person as the shooter.
- If the phone or tripod is bumped mid-session, the marked rim zone may
  become wrong. The app should warn the user and ask them to recalibrate.

## 12. Testing Approach

- Record a small set of sample clips first: clear makes, clear misses, rim
  bounces, and airballs. Use these to check the ball-tracking and make/miss
  rules before testing on a real court.
- Test the calibration flow on more than one court, with different lighting
  and different backboard colors, to check it holds up outside one fixed
  setup.
