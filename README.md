# Wrapbid

Vehicle advertising marketplace for panel-level auctions, verified installation, and monthly driver payout eligibility.

## Run locally

```bash
npm install
npx prisma migrate deploy
npx prisma generate
npm run dev
```

Open http://localhost:3000.

## 3D vehicle previews

The listing Studio uses Three.js through React Three Fiber and Drei. Vehicle selection is resolved by typed configuration in `src/lib/vehicleTemplates.ts`: exact generation first, explicitly mapped nearest generation second, generic body type third, and a non-3D fallback last. All runtime GLB assets are local under `public/vehicles/`; their provenance is recorded in `public/vehicles/LICENSES.md`.

Each template defines an estimated safe advertising area rather than treating the entire physical panel as printable. The viewer normalizes model scale uniformly against the configured real vehicle length, provides orbit/zoom and panel camera presets, and places uploaded artwork and a mandatory QR marker slightly above the surface. Creative placement is stored per listing.

The Studio calculates width DPI, height DPI, the limiting effective DPI, and recommended 100 DPI pixel dimensions. Finalized placements can be downloaded as a physical-size PDF or opened in the browser PDF viewer for an explicit plotter print action.

**The 3D model is a visual placement aid and does not replace a professional vehicle wrap template or physical measurement before production.** Estimated safe areas, bleed, trim, vinyl material, color profile, and vehicle condition must be verified by the print operator.

### Configured plotter

The default production profile is a **MYJET 1.8 m with one Epson i3200-E1 eco-solvent head**. Wrapbid reserves conservative machine margins and uses 1750 mm as the configured printable width inside the nominal 1800 mm media width. Jobs are checked in the most efficient orientation, with the shorter dimension across the roll.

Measure the actual loaded-media margins and update `src/lib/plotterProfiles.ts` if the usable width differs. RIP passes, heater temperatures, ink limits and ICC profile are deliberately left to the operator because they depend on the installed ink, vinyl, laminate and RIP software.
