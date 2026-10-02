import { ComponentType, lazy } from 'react';
import { Home, Users, Pill, Building2, Heart, Briefcase, Utensils, Video, Calendar, Gift, Bot, Palette, Map, LucideIcon } from 'lucide-react';

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

/**
 * Every module (and its deep "frame" screens below) is its own lazy-loaded chunk: a session that
 * only ever opens Dashboard + SilverBox should never download ElderLink/Care360/TeleHealth/…'s code.
 * A module's frames live in the SAME chunk as the module itself (not split further) since opening
 * one almost always means the other will be needed too — splitting them apart would just add a
 * second round-trip for no real benefit.
 */
const Dashboard = lazy(() => import('../components/Dashboard'));
const ElderLink = lazy(() => import('../components/ElderLink'));
const SilverBox = lazy(() => import('../components/SilverBox'));
const AgeWellLiving = lazy(() => import('../components/AgeWellLiving'));
const Care360 = lazy(() => import('../components/Care360'));
const GoldenCareJobs = lazy(() => import('../components/GoldenCareJobs'));
const NutriSenior = lazy(() => import('../components/NutriSenior'));
const TeleHealth = lazy(() => import('../components/TeleHealth'));
const CommunityActivities = lazy(() => import('../components/CommunityActivities'));
const RewardsLoyalty = lazy(() => import('../components/RewardsLoyalty'));
const CareAssistant = lazy(() => import('../components/ai/CareAssistant'));

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

/** Each `.then(m => ({ default: m.X }))` still resolves to the SAME chunk per source file — Rollup
 * dedupes multiple lazy() references to one dynamic import() specifier into a single chunk, so this
 * is one network request per module's frames, not one per frame. */
const elderLinkFrames = () => import('../components/frames/ElderLinkFrames');
const nutriSeniorFrames = () => import('../components/frames/NutriSeniorFrames');
const silverBoxFrames = () => import('../components/frames/SilverBoxFrames');
const care360Frames = () => import('../components/frames/Care360Frames');
const ageWellFrames = () => import('../components/frames/AgeWellFrames');

/** Deep frames. Frame ids are globally unique, so one flat table is enough. */
export const FRAMES: Record<string, { module: string; Component: ComponentType; needsData?: boolean }> = {
  EL01_SearchResults: { module: 'elderlink', Component: lazy(() => elderLinkFrames().then((m) => ({ default: m.EL01_SearchResults }))) },
  EL02_Caregiver_Profile: { module: 'elderlink', Component: lazy(() => elderLinkFrames().then((m) => ({ default: m.EL02_Caregiver_Profile }))), needsData: true },
  EL03_ScheduleVisit: { module: 'elderlink', Component: lazy(() => elderLinkFrames().then((m) => ({ default: m.EL03_ScheduleVisit }))), needsData: true },
  EL05_Booking_Confirmation: { module: 'elderlink', Component: lazy(() => elderLinkFrames().then((m) => ({ default: m.EL05_Booking_Confirmation }))) },

  NS01_MenuOverview: { module: 'nutrisenior', Component: lazy(() => nutriSeniorFrames().then((m) => ({ default: m.NS01_MenuOverview }))) },
  NS02_SelectPlan: { module: 'nutrisenior', Component: lazy(() => nutriSeniorFrames().then((m) => ({ default: m.NS02_SelectPlan }))) },
  NS03_PlaceOrder: { module: 'nutrisenior', Component: lazy(() => nutriSeniorFrames().then((m) => ({ default: m.NS03_PlaceOrder }))), needsData: true },
  NS04_TrackDelivery: { module: 'nutrisenior', Component: lazy(() => nutriSeniorFrames().then((m) => ({ default: m.NS04_TrackDelivery }))) },

  SB01_MedsOverview: { module: 'silverbox', Component: lazy(() => silverBoxFrames().then((m) => ({ default: m.SB01_MedsOverview }))) },
  SB02_MarkAsTaken: { module: 'silverbox', Component: lazy(() => silverBoxFrames().then((m) => ({ default: m.SB02_MarkAsTaken }))), needsData: true },
  SB03_TakeNow: { module: 'silverbox', Component: lazy(() => silverBoxFrames().then((m) => ({ default: m.SB03_TakeNow }))), needsData: true },
  SB04_Med_History: { module: 'silverbox', Component: lazy(() => silverBoxFrames().then((m) => ({ default: m.SB04_Med_History }))) },

  C360_RecordsList: { module: 'care360', Component: lazy(() => care360Frames().then((m) => ({ default: m.C360_RecordsList }))) },
  C360_UploadRecord: { module: 'care360', Component: lazy(() => care360Frames().then((m) => ({ default: m.C360_UploadRecord }))) },
  C360_ViewRecord: { module: 'care360', Component: lazy(() => care360Frames().then((m) => ({ default: m.C360_ViewRecord }))), needsData: true },
  C360_ShareWithDoctor: { module: 'care360', Component: lazy(() => care360Frames().then((m) => ({ default: m.C360_ShareWithDoctor }))), needsData: true },
  C360_RequestRefill: { module: 'care360', Component: lazy(() => care360Frames().then((m) => ({ default: m.C360_RequestRefill }))) },

  AW01_CommunityChatRoom: { module: 'agewell', Component: lazy(() => ageWellFrames().then((m) => ({ default: m.AW01_CommunityChatRoom }))) },
  AW04_ApplyNow: { module: 'agewell', Component: lazy(() => ageWellFrames().then((m) => ({ default: m.AW04_ApplyNow }))), needsData: true },
  AW05_ModifyApplication: { module: 'agewell', Component: lazy(() => ageWellFrames().then((m) => ({ default: m.AW05_ModifyApplication }))), needsData: true },
};
