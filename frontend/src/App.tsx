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
      </Route>
    </Routes>
  )
}

export default App
