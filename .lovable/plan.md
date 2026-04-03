## Mobile UI/UX Overhaul Plan

### Phase 1: Assets & Foundation
1. Copy character images to `src/assets/`
2. Update dark theme tokens in `index.css` for luxury dark aesthetic
3. Create splash screen component

### Phase 2: Entry Flow
4. Create new Home screen ("O Gancho") - full screen, no scroll, with character
5. Modify quiz flow to be full-screen with character reactions
6. Add returning user detection (redirect to Roteiro if has session)

### Phase 3: Navigation
7. Redesign TabBar - 5 tabs: Arquétipo(Home), Roteiro, Mapão, Idioma, Perfil
8. Hide TabBar until first quiz completion

### Phase 4: Character Integration
9. Explorer version → Share card & onboarding (waving character)
10. Guide version → Roteiro/Gemas chat (coconut/relaxed character)  
11. Analyst version → Mapão tab (magnifying glass character)
12. Communicator version → Language studio (diary/reading character)

### Phase 5: Polish
13. Empty states with character + invite phrase
14. Paywall redesign with character + horizontal plan cards
15. Animation passes (fade-in, subtle glows)

### Key Decisions
- Character mapping: Waving=Explorer, Magnifying glass=Analyst, Reading=Communicator, Coconut=Guide
- Dark base: #0D1117 with accent pings from character colors (coral, teal, mustard)
- Typography: Merriweather for headings, Inter for body (existing)
