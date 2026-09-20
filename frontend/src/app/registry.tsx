import { ComponentType, lazy } from 'react';
import { Home, Users, Pill, Building2, Heart, Briefcase, Utensils, Video, Calendar, Gift, Bot, Palette, Map, LucideIcon } from 'lucide-react';

import Dashboard from '../components/Dashboard';
import ElderLink from '../components/ElderLink';
import SilverBox from '../components/SilverBox';
import AgeWellLiving from '../components/AgeWellLiving';
import Care360 from '../components/Care360';
import GoldenCareJobs from '../components/GoldenCareJobs';
import NutriSenior from '../components/NutriSenior';
import TeleHealth from '../components/TeleHealth';
import CommunityActivities from '../components/CommunityActivities';
import RewardsLoyalty from '../components/RewardsLoyalty';
import CareAssistant from '../components/ai/CareAssistant';

import { EL01_SearchResults, EL02_Caregiver_Profile, EL03_ScheduleVisit, EL05_Booking_Confirmation } from '../components/frames/ElderLinkFrames';
import { NS01_MenuOverview, NS02_SelectPlan, NS03_PlaceOrder, NS04_TrackDelivery } from '../components/frames/NutriSeniorFrames';
import { SB01_MedsOverview, SB02_MarkAsTaken, SB03_TakeNow, SB04_Med_History } from '../components/frames/SilverBoxFrames';
import { C360_RecordsList, C360_UploadRecord, C360_ViewRecord, C360_ShareWithDoctor, C360_RequestRefill } from '../components/frames/Care360Frames';
import { AW01_CommunityChatRoom, AW04_ApplyNow, AW05_ModifyApplication } from '../components/frames/AgeWellFrames';

export type Role = 'senior' | 'family';
export type ModulePage = ComponentType<{ userRole: Role }>;

export interface ModuleDef {
  id: string;
  name: string;
  icon: LucideIcon;
  emoji: string;
  Component: ModulePage;
  /** Only listed in the sidebar in development builds (design-review tools). */
  devOnly?: boolean;
}

// Design-review tools are code-split and never shipped to production users.
const BrandShowcase = lazy(() => import('../components/brand/BrandShowcase'));
const InteractionMap = lazy(() => import('../components/navigation/InteractionMap'));

export const MODULES: ModuleDef[] = [
  { id: 'dashboard', name: 'Dashboard', icon: Home, emoji: '🏠', Component: Dashboard },
  { id: 'elderlink', name: 'ElderLink', icon: Users, emoji: '💛', Component: ElderLink },
  { id: 'silverbox', name: 'SilverBox', icon: Pill, emoji: '💊', Component: SilverBox },
  { id: 'agewell', name: 'AgeWell Living', icon: Building2, emoji: '🏡', Component: AgeWellLiving },
  { id: 'care360', name: 'Care360', icon: Heart, emoji: '👨‍⚕️', Component: Care360 },
  { id: 'goldencares', name: 'GoldenCare Jobs', icon: Briefcase, emoji: '🥇', Component: GoldenCareJobs },
  { id: 'nutrisenior', name: 'NutriSenior', icon: Utensils, emoji: '🍱', Component: NutriSenior },
  { id: 'telehealth', name: 'TeleHealth', icon: Video, emoji: '📺', Component: TeleHealth },
  { id: 'communityactivities', name: 'Community Activities', icon: Calendar, emoji: '📅', Component: CommunityActivities },
  { id: 'rewardsloyalty', name: 'Rewards & Loyalty', icon: Gift, emoji: '🎁', Component: RewardsLoyalty },
  { id: 'assistant', name: 'Care Assistant', icon: Bot, emoji: '✨', Component: CareAssistant },
  { id: 'brandshowcase', name: 'Brand System', icon: Palette, emoji: '🎨', Component: BrandShowcase as unknown as ModulePage, devOnly: true },
  { id: 'interactionmap', name: 'Interaction Map', icon: Map, emoji: '🗺️', Component: InteractionMap as unknown as ModulePage, devOnly: true },
];

export const visibleModules = () => MODULES.filter((m) => !m.devOnly || import.meta.env.DEV);

/** Deep frames. Frame ids are globally unique, so one flat table is enough. */
export const FRAMES: Record<string, { module: string; Component: ComponentType; needsData?: boolean }> = {
  EL01_SearchResults: { module: 'elderlink', Component: EL01_SearchResults },
  EL02_Caregiver_Profile: { module: 'elderlink', Component: EL02_Caregiver_Profile, needsData: true },
  EL03_ScheduleVisit: { module: 'elderlink', Component: EL03_ScheduleVisit, needsData: true },
  EL05_Booking_Confirmation: { module: 'elderlink', Component: EL05_Booking_Confirmation },

  NS01_MenuOverview: { module: 'nutrisenior', Component: NS01_MenuOverview },
  NS02_SelectPlan: { module: 'nutrisenior', Component: NS02_SelectPlan },
  NS03_PlaceOrder: { module: 'nutrisenior', Component: NS03_PlaceOrder, needsData: true },
  NS04_TrackDelivery: { module: 'nutrisenior', Component: NS04_TrackDelivery },

  SB01_MedsOverview: { module: 'silverbox', Component: SB01_MedsOverview },
  SB02_MarkAsTaken: { module: 'silverbox', Component: SB02_MarkAsTaken, needsData: true },
  SB03_TakeNow: { module: 'silverbox', Component: SB03_TakeNow, needsData: true },
  SB04_Med_History: { module: 'silverbox', Component: SB04_Med_History },

  C360_RecordsList: { module: 'care360', Component: C360_RecordsList },
  C360_UploadRecord: { module: 'care360', Component: C360_UploadRecord },
  C360_ViewRecord: { module: 'care360', Component: C360_ViewRecord, needsData: true },
  C360_ShareWithDoctor: { module: 'care360', Component: C360_ShareWithDoctor, needsData: true },
  C360_RequestRefill: { module: 'care360', Component: C360_RequestRefill },

  AW01_CommunityChatRoom: { module: 'agewell', Component: AW01_CommunityChatRoom },
  AW04_ApplyNow: { module: 'agewell', Component: AW04_ApplyNow, needsData: true },
  AW05_ModifyApplication: { module: 'agewell', Component: AW05_ModifyApplication, needsData: true },
};
