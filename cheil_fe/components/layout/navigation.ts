import AdminPanelSettingsOutlinedIcon from "@mui/icons-material/AdminPanelSettingsOutlined";
import AccountTreeOutlinedIcon from "@mui/icons-material/AccountTreeOutlined";
import AnalyticsOutlinedIcon from "@mui/icons-material/AnalyticsOutlined";
import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";
import CodeOutlinedIcon from "@mui/icons-material/CodeOutlined";
import CompareArrowsOutlinedIcon from "@mui/icons-material/CompareArrowsOutlined";
import ConstructionOutlinedIcon from "@mui/icons-material/ConstructionOutlined";
import CorporateFareOutlinedIcon from "@mui/icons-material/CorporateFareOutlined";
import BusinessCenterOutlinedIcon from "@mui/icons-material/BusinessCenterOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import EngineeringOutlinedIcon from "@mui/icons-material/EngineeringOutlined";
import GavelIcon from "@mui/icons-material/Gavel";
import NotificationsActiveOutlinedIcon from "@mui/icons-material/NotificationsActiveOutlined";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import LightbulbOutlinedIcon from "@mui/icons-material/LightbulbOutlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import PercentOutlinedIcon from "@mui/icons-material/PercentOutlined";
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
  pqBid: GavelIcon,
  pqClientCode: CorporateFareOutlinedIcon,
  pqCommonCode: CodeOutlinedIcon,
  pqConstruction: ConstructionOutlinedIcon,
  pqCertificate: WorkspacePremiumOutlinedIcon,
  pqCompanyPerformance: AnalyticsOutlinedIcon,
  pqCompanyPerformanceEngineers: EngineeringOutlinedIcon,
  pqDocumentEngineerPerformanceDocs: DescriptionOutlinedIcon,
  pqDocumentCompanyPerformanceDocs: DescriptionOutlinedIcon,
  pqDocumentParticipatingEngineers: PeopleAltOutlinedIcon,
  pqDocumentEngineerOverlapCheck: CompareArrowsOutlinedIcon,
  pqEngineer: EngineeringOutlinedIcon,
  pqEngineerPerformance: AnalyticsOutlinedIcon,
  pqNewEmploymentRates: PercentOutlinedIcon,
  pqShinindo: WorkspacePremiumOutlinedIcon,
  pqSimilarServicePerformance: AnalyticsOutlinedIcon,
  pqServicePerformance: AnalyticsOutlinedIcon,
  pqWorkOverlap: CompareArrowsOutlinedIcon,
  codeCommonCode: CodeOutlinedIcon,
  codeDepartment: AccountTreeOutlinedIcon,
  codeHeadquarters: CorporateFareOutlinedIcon,
  permissionProgramManagement: SecurityOutlinedIcon,
  notifications: NotificationsActiveOutlinedIcon,
  notice: CampaignOutlinedIcon,
  education: SchoolOutlinedIcon,
  pqNewTechnology: LightbulbOutlinedIcon,
  pqService: BusinessCenterOutlinedIcon,
};
