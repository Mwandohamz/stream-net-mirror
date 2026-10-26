# Roadmap — dashboard native polish + in-app streaming + APK downloads

## Current request
- [x] Mobile sidebar and gradient Play action
- [x] Account transaction/subscription history and in-app notification inbox (existing account records, not push notifications)
- [x] Animated native launch using existing icon/movie/football assets
- [x] Separate own-app APK upload from legacy external APK; signed release APK workflow and instructions
- [x] 22 tests, preview compilation, workflow syntax and signed-in mobile validation
- [ ] Build/install signed APK and verify real-device launch/login/payment/playback — requires user's GitHub signing secrets/workflow and Android device
- [ ] Upload own Stream NetMirror release APK in Admin Settings — requires successful GitHub APK artifact; old external APK is intentionally unavailable

- [x] Swap dashboard tab icons: House for Home, ball for Football (bottom nav + sidebar)
- [x] Login/signup/account creation → straight to /dashboard (already in place, verified)
- [x] All stream links open inside the app; removed external-open options; iframe back button + platform switcher + popup/redirect blocking
- [x] APK download for everyone, tracked downloads (device/time) visible in admin Settings
- [x] LIVE badge on live football fixtures
- [x] Reduced dashboard text; compact link-rotation notice
- [x] Profile section redesign (gradient header, centered avatar, info rows, plan status); sidebar Download App button with Android-warning dialog
- [x] Play-icon loading indicator replacing spinners
- [x] Verified: typecheck, 20 tests, build OK, signed-in desktop + mobile browser pass, download endpoint returns signed APK URL and logs the download
