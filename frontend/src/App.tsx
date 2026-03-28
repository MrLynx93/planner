import { Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { GroupSchedulePage } from '@/pages/schedule/GroupSchedulePage'
import { TeacherSchedulePage } from '@/pages/schedule/TeacherSchedulePage'
import { AnnexesPage } from '@/pages/AnnexesPage'
import { TeachersPage } from '@/pages/TeachersPage'
import { GroupsPage } from '@/pages/GroupsPage'
import { ChildrenPage } from '@/pages/ChildrenPage'
import { RulesPage } from '@/pages/RulesPage'
import { ClosedDaysPage } from '@/pages/ClosedDaysPage'
import { DraftAnnexSettingsPage } from '@/pages/draft-annex/DraftAnnexSettingsPage'
import { DraftAnnexTeachersPage } from '@/pages/draft-annex/DraftAnnexTeachersPage'
import { DraftAnnexGroupsPage } from '@/pages/draft-annex/DraftAnnexGroupsPage'
import { DraftAnnexChildrenPage } from '@/pages/draft-annex/DraftAnnexChildrenPage'
import { DraftAnnexRulesPage } from '@/pages/draft-annex/DraftAnnexRulesPage'

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to="/schedule/groups" replace />} />
        <Route path="/schedule/groups" element={<GroupSchedulePage />} />
        <Route path="/schedule/teachers" element={<TeacherSchedulePage />} />
        <Route path="/annexes" element={<AnnexesPage />} />
        <Route path="/teachers" element={<TeachersPage />} />
        <Route path="/groups" element={<GroupsPage />} />
        <Route path="/children" element={<ChildrenPage />} />
        <Route path="/rules" element={<RulesPage />} />
        <Route path="/closed-days" element={<ClosedDaysPage />} />
        <Route path="/draft-annex/settings" element={<DraftAnnexSettingsPage />} />
        <Route path="/draft-annex/teachers" element={<DraftAnnexTeachersPage />} />
        <Route path="/draft-annex/groups" element={<DraftAnnexGroupsPage />} />
        <Route path="/draft-annex/children" element={<DraftAnnexChildrenPage />} />
        <Route path="/draft-annex/rules" element={<DraftAnnexRulesPage />} />
      </Route>
    </Routes>
  )
}

export default App
