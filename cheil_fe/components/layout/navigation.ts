import AdminPanelSettingsOutlinedIcon from "@mui/icons-material/AdminPanelSettingsOutlined";
import AnalyticsOutlinedIcon from "@mui/icons-material/AnalyticsOutlined";
import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";
import CodeOutlinedIcon from "@mui/icons-material/CodeOutlined";
import ConstructionOutlinedIcon from "@mui/icons-material/ConstructionOutlined";
import CorporateFareOutlinedIcon from "@mui/icons-material/CorporateFareOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import EngineeringOutlinedIcon from "@mui/icons-material/EngineeringOutlined";
import NotificationsActiveOutlinedIcon from "@mui/icons-material/NotificationsActiveOutlined";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import SecurityOutlinedIcon from "@mui/icons-material/SecurityOutlined";
import WorkspacePremiumOutlinedIcon from "@mui/icons-material/WorkspacePremiumOutlined";
import WorkOutlineOutlinedIcon from "@mui/icons-material/WorkOutlineOutlined";
import type { SvgIconComponent } from "@mui/icons-material";
import type { MenuIconKey } from "@/shared/navigation/menu";

export const menuIconMap: Record<MenuIconKey, SvgIconComponent> = {
  analytics: AnalyticsOutlinedIcon,
  certificate: WorkspacePremiumOutlinedIcon,
  campaign: CampaignOutlinedIcon,
  users: PeopleAltOutlinedIcon,
  settings: SettingsOutlinedIcon,
  code: CodeOutlinedIcon,
  permissions: AdminPanelSettingsOutlinedIcon,
  pq: WorkOutlineOutlinedIcon,
  pqAnnouncement: CampaignOutlinedIcon,
  pqClientCode: CorporateFareOutlinedIcon,
  pqCommonCode: CodeOutlinedIcon,
  pqConstruction: ConstructionOutlinedIcon,
  pqCertificate: WorkspacePremiumOutlinedIcon,
  pqCompanyPerformance: AnalyticsOutlinedIcon,
  pqCompanyPerformanceEngineers: EngineeringOutlinedIcon,
  pqDocumentEngineerPerformanceDocs: DescriptionOutlinedIcon,
  pqDocumentParticipatingEngineers: DescriptionOutlinedIcon,
  pqEngineer: EngineeringOutlinedIcon,
  pqNewTechnology: WorkspacePremiumOutlinedIcon,
  pqService: SchoolOutlinedIcon,
  codeCommonCode: CodeOutlinedIcon,
  codeDepartment: PeopleAltOutlinedIcon,
  codeHeadquarters: WorkOutlineOutlinedIcon,
  permissionProgramManagement: SecurityOutlinedIcon,
  notifications: NotificationsActiveOutlinedIcon,
};
