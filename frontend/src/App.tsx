import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { AnnexLayout } from '@/components/layout/AnnexLayout';
import { GroupSchedulePage } from '@/pages/schedule/GroupSchedulePage';
import { TeacherSchedulePage } from '@/pages/schedule/TeacherSchedulePage';
import { ScheduleExceptionsPage } from '@/pages/schedule/ScheduleExceptionsPage';
import { AnnexesPage } from '@/pages/AnnexesPage';
import { TeachersPage } from '@/pages/TeachersPage';
import { GroupsPage } from '@/pages/GroupsPage';
import { ChildrenPage } from '@/pages/ChildrenPage';
import { RulesPage } from '@/pages/RulesPage';
import { ClosedDaysPage } from '@/pages/ClosedDaysPage';
import { AnnexSettingsPage } from '@/pages/annex/AnnexSettingsPage';
import { AnnexTeachersPage } from '@/pages/annex/AnnexTeachersPage';
import { AnnexGroupsPage } from '@/pages/annex/AnnexGroupsPage';
import { AnnexChildrenPage } from '@/pages/annex/AnnexChildrenPage';
import { AnnexRulesPage } from '@/pages/annex/AnnexRulesPage';
import { AnnexPlanGroupPage } from '@/pages/annex/AnnexPlanGroupPage';
import { AnnexPlanTeacherPage } from '@/pages/annex/AnnexPlanTeacherPage';
import { AnnexPlanOverviewPage } from '@/pages/annex/AnnexPlanOverviewPage';
import { GlobalRulesPage } from '@/pages/GlobalRulesPage';
import { ViolationsPage } from '@/pages/ViolationsPage';

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to="/schedule/groups" replace />} />
        <Route path="/schedule/groups" element={<GroupSchedulePage />} />
        <Route path="/schedule/teachers" element={<TeacherSchedulePage />} />
        <Route
          path="/schedule/exceptions"
          element={<ScheduleExceptionsPage />}
        />
        <Route path="/annexes" element={<AnnexesPage />} />
        <Route path="/teachers" element={<TeachersPage />} />
        <Route path="/groups" element={<GroupsPage />} />
        <Route path="/children" element={<ChildrenPage />} />
        <Route path="/rules" element={<RulesPage />} />
        <Route path="/closed-days" element={<ClosedDaysPage />} />
        <Route path="/global-rules" element={<GlobalRulesPage />} />
        <Route path="/violations" element={<ViolationsPage />} />
        <Route path="/annexes/:id" element={<AnnexLayout />}>
          <Route index element={<Navigate to="settings" replace />} />
          <Route path="settings" element={<AnnexSettingsPage />} />
          <Route path="teachers" element={<AnnexTeachersPage />} />
          <Route path="groups" element={<AnnexGroupsPage />} />
          <Route path="children" element={<AnnexChildrenPage />} />
          <Route path="rules" element={<AnnexRulesPage />} />
          <Route path="plan/groups" element={<AnnexPlanGroupPage />} />
          <Route path="plan/teachers" element={<AnnexPlanTeacherPage />} />
          <Route path="plan/overview" element={<AnnexPlanOverviewPage />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
