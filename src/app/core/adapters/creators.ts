import { MockupCreator } from '../models/mockup.model';

export const MOCK_CREATORS: MockupCreator[] = [
  { id: 'c1', name: 'MockupLab',    avatar: 'https://i.pravatar.cc/40?img=1',  isVerified: true,  followers: 18400, totalAssets: 428 },
  { id: 'c2', name: 'StudioFrame',  avatar: 'https://i.pravatar.cc/40?img=4',  isVerified: true,  followers: 11200, totalAssets: 315 },
  { id: 'c3', name: 'PixelScene',   avatar: 'https://i.pravatar.cc/40?img=2',  isVerified: false, followers: 6800,  totalAssets: 147 },
  { id: 'c4', name: 'CraftMock',    avatar: 'https://i.pravatar.cc/40?img=8',  isVerified: true,  followers: 24600, totalAssets: 592 },
  { id: 'c5', name: 'SceneLab',     avatar: 'https://i.pravatar.cc/40?img=12', isVerified: false, followers: 4200,  totalAssets: 98  },
  { id: 'c6', name: 'DesignForge',  avatar: 'https://i.pravatar.cc/40?img=6',  isVerified: true,  followers: 13800, totalAssets: 380 },
  { id: 'c7', name: 'ProMockup',    avatar: 'https://i.pravatar.cc/40?img=9',  isVerified: true,  followers: 9100,  totalAssets: 264 },
  { id: 'c8', name: 'VisualCraft',  avatar: 'https://i.pravatar.cc/40?img=15', isVerified: true,  followers: 31000, totalAssets: 680 },
];

export function pickCreator(index: number): MockupCreator {
  return MOCK_CREATORS[index % MOCK_CREATORS.length];
}
