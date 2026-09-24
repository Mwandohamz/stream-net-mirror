# Dashboard identity, logo, avatars, and faster navigation

## Result
- Use the uploaded circular streaming artwork (`final.png`) as the single StreamNetMirror logo across the public site, dashboard, account screens, favicon, and installable app icons.
- Give the member area a layered Netflix-red, Premier League magenta, and UEFA-blue atmosphere while keeping text and controls readable on mobile.
- Keep unpaid members inside the dashboard, but route every locked action to `/payment`, where all active plans remain available.

## Dashboard presentation
- Add responsive visual backdrops for Movies & Series, Football, Watch, Account, and Dashboard rather than one flat background.
- Use a cinematic movie-poster collage for Movies & Series and a football-player/stadium collage inspired by Haaland, Messi, Ronaldo, and Salah for Football.
- Keep the existing five-action mobile navigation and protected-link flow unchanged; improve compact card sizing, contrast, spacing, and image fallbacks.
- Preserve the two-step paid link flow: link picker, then the existing link-refresh notice.

## Profiles and avatars
- Create five distinct streaming-themed avatars with consistent styling.
- Add avatar selection during account creation and save the choice to the profile.
- Default new and existing accounts without a selected image to avatar one.
- Add the same avatar picker to Account settings while retaining custom image uploads up to 2 MB.

## Speed and reliability
- Reuse cached membership, profile, settings, and content results while refreshing quietly in the background.
- Avoid remounting the whole dashboard when changing sections and keep loading placeholders dimensionally stable.
- Review the existing roadmap and current diagnostics; finish only any clearly incomplete work related to these requests.

## Technical details
- Store the uploaded logo through the project asset flow; derive correctly padded 64, 192, and 512 pixel install icons and update the manifest/head references.
- Generate and store dashboard backgrounds and avatars as optimized app assets.
- Update the account-creation profile trigger so the selected avatar is persisted securely, without changing payment or subscription logic.
- Validate signup selection/defaulting, unpaid payment routing, paid protected links, account avatar changes, mobile/desktop layouts, type safety, tests, and the preview build.
