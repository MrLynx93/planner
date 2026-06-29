# Release Notes

## Version 1.1

- **Teacher's time blocks overlap detection** — the tabular plan view now checks whether a teacher is assigned to more than one group at the same time on any day.
- **Excel export print improvements** — exported files now scale to fill the full page when printing, and cell heights are automatically adjusted so all content is visible.
- Teachers that are not assigned to a group are now shown in the planning table.
---

## Version 1.0

### Annex Management
- Create and manage **Annexes** as top-level planning periods with defined start/end dates and operating hours.
- Full annex lifecycle: **DRAFT → CURRENT → FINISHED**. Only one DRAFT annex may exist at a time; activating it archives the previous CURRENT annex as FINISHED.
- DRAFT annexes are fully editable; CURRENT annexes show a warning banner but can still be adjusted; FINISHED annexes are read-only.

### Staff Management
- **Teachers** — create, edit and delete teacher records. Assign teachers to an annex with a default group.
- **Groups** — create, edit and delete groups. Assign groups to an annex with optional per-group schedule start and end times.
- **Staff page** — unified page per annex for managing teacher–group assignments in one place.

### Rules & Validation
- Four configurable rule types: `TEACHER_WEEKLY_HOURS_MIN`, `TEACHER_MAX_HOURS_PER_DAY`, `GROUP_MIN_TEACHERS`, `GROUP_MAX_TEACHERS`.
- Three-level rule priority: annex-specific entity rule → annex default → global default.
- Hour-based rules (`TEACHER_WEEKLY_HOURS_MIN`, `TEACHER_MAX_HOURS_PER_DAY`) support **partial hours** (e.g. 22.5 h/week).
- **Template violations** panel — live validation of the draft schedule against all active rules, shown in the tabular plan view.

### Schedule Planning — Draft Annex
- **Group planner** (`plan/groups`) — select a group, drag teachers from the side panel onto the weekly calendar to create template time blocks.
- **Teacher planner** (`plan/teachers`) — select a teacher, drag groups onto the weekly calendar.
- **Overview planner** (`plan/overview`) — day or week view with group columns; create blocks by dragging teachers onto group columns.
- **Tabular planner** (`plan/table`) — table-style view (rows = group × teacher pairs, columns = Mon–Fri). Drag teachers from the side panel to create blocks; click a block to edit its start/end time or delete it. Displays weekly hours and overhours per row. Includes a resizable violations panel at the bottom.
- **Automatic plan generation** — one-click generator that produces an initial schedule using simulated annealing, respecting group staffing and teacher hour rules.

### Schedule Views — Current Annex
- **Group schedule** — read-only weekly calendar filtered by group; blocks colour-coded per teacher.
- **Teacher schedule** — read-only weekly calendar filtered by teacher; blocks colour-coded per group.
- Week navigation with annex and filter selectors.
- **Opening & closing hours** summary per day — shows which teachers open and close the preschool.
- Group working hours range displayed on the calendar.
- **Violations panel** on the right side of the calendar — shows rule violations for the selected week and month.

### Export & Print
- **Export to Excel** — exports the tabular plan view to a colour-coded landscape A4 `.xlsx` file (group, teacher, Mon–Fri blocks, hours, overhours columns). Column headers respect the active language.
- **Print** — prints the plan directly from the application via the system print dialog.

### Database Import and Export
- **Export database** — saves the current SQLite database to a file.
- **Import database** — restores the database from a previously exported file.
- **Clear database** — resets all data to a clean state.

### Internationalisation
- Full UI available in **Polish** and **English**.

### Desktop Application (Electron)
- Standalone desktop app for **Windows** and **macOS** — no separate server or browser required.
- Embedded Spring Boot backend started automatically on launch.
- Native app icon.
