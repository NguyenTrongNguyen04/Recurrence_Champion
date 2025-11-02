import React from 'react';
import {
  Home,
  FlaskConical,
  Play,
  BarChart3,
  Clock,
  Settings,
  ChevronLeft,
  Search,
  Bell,
  User,
  LogOut,
  X,
  Github,
  Code2,
  Upload,
  CheckCircle2,
  XCircle,
  FileText,
  Clipboard,
  Sparkles,
  Terminal,
  Info,
  MoreVertical,
  Download,
  RefreshCw,
  Eye,
  EyeOff,
  FileCheck,
  AlertTriangle,
  AlertCircle,
  MessageCircle,
  Send,
  Minus,
  Maximize2,
  Minimize2,
  type LucideIcon,
} from 'lucide-react';

// Wrapper component để giữ backward compatibility với API hiện tại
const createIconComponent = (LucideIcon: LucideIcon) => {
  return (props: React.SVGProps<SVGSVGElement>) => (
    <LucideIcon {...props} />
  );
};

// Export các icon với tên giữ nguyên để backward compatible
export const HomeIcon = createIconComponent(Home);
export const BeakerIcon = createIconComponent(FlaskConical);
export const PlayIcon = createIconComponent(Play);
export const ChartBarIcon = createIconComponent(BarChart3);
export const ClockIcon = createIconComponent(Clock);
export const CogIcon = createIconComponent(Settings);
export const ChevronLeftIcon = createIconComponent(ChevronLeft);
export const SearchIcon = createIconComponent(Search);
export const BellIcon = createIconComponent(Bell);
export const UserIcon = createIconComponent(User);
export const LogoutIcon = createIconComponent(LogOut);
export const XIcon = createIconComponent(X);
export const GithubIcon = createIconComponent(Github);
export const CodeBracketIcon = createIconComponent(Code2);
export const UploadIcon = createIconComponent(Upload);
export const CheckCircleIcon = createIconComponent(CheckCircle2);
export const XCircleIcon = createIconComponent(XCircle);
export const DocumentTextIcon = createIconComponent(FileText);
export const ClipboardIcon = createIconComponent(Clipboard);
export const SparklesIcon = createIconComponent(Sparkles);
export const TerminalIcon = createIconComponent(Terminal);
export const InformationCircleIcon = createIconComponent(Info);
export const EllipsisVerticalIcon = createIconComponent(MoreVertical);
export const DocumentArrowDownIcon = createIconComponent(Download);
export const RefreshIcon = createIconComponent(RefreshCw);
export const EyeIcon = createIconComponent(Eye);
export const EyeSlashIcon = createIconComponent(EyeOff);
export const RequirementIcon = createIconComponent(FileCheck);
export const AlertTriangleIcon = createIconComponent(AlertTriangle);
export const ExclamationCircleIcon = createIconComponent(AlertCircle);
export const ChatBubbleIcon = createIconComponent(MessageCircle);
export const SendIcon = createIconComponent(Send);
export const MinusIcon = createIconComponent(Minus);
export const MaximizeIcon = createIconComponent(Maximize2);
export const MinimizeIcon = createIconComponent(Minimize2);

// TestFlowLogo - Logo mới với thiết kế công nghệ
export const TestFlowLogo = () => {
  return (
    <div className="flex items-center space-x-3">
      {/* Hexagon với logo bên trong */}
      <div className="relative flex-shrink-0">
        <svg width="56" height="56" viewBox="0 0 48 48" className="drop-shadow-lg">
          {/* Hình lục giác nền với hiệu ứng 3D */}
          <defs>
            <linearGradient id="hexagonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1E3230" />
              <stop offset="50%" stopColor="#27403E" />
              <stop offset="100%" stopColor="#1A2928" />
            </linearGradient>
            <linearGradient id="circuitGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#21A691" />
              <stop offset="100%" stopColor="#87DF2C" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Hình lục giác */}
          <path
            d="M24 4 L36 10 L40 22 L36 34 L24 40 L12 34 L8 22 L12 10 Z"
            fill="url(#hexagonGradient)"
            stroke="#1E3230"
            strokeWidth="0.5"
            className="rounded-lg"
          />
          
          {/* Vòng tròn mạch điện tử */}
          <circle cx="24" cy="20" r="14" fill="none" stroke="url(#circuitGradient)" strokeWidth="1.5" opacity="0.8" filter="url(#glow)" />
          
          {/* Các đường mạch điện tử trong vòng tròn */}
          <circle cx="24" cy="12" r="1.5" fill="url(#circuitGradient)" />
          <circle cx="32" cy="18" r="1.5" fill="url(#circuitGradient)" />
          <circle cx="24" cy="28" r="1.5" fill="url(#circuitGradient)" />
          <circle cx="16" cy="18" r="1.5" fill="url(#circuitGradient)" />
          <path d="M24 12 L32 18 M24 28 L32 18 M24 28 L16 18 M24 12 L16 18" stroke="url(#circuitGradient)" strokeWidth="1" opacity="0.6" />
          
          {/* Kính lúp */}
          <g transform="translate(24, 20)">
            {/* Thấu kính */}
            <circle cx="0" cy="0" r="8" fill="none" stroke="url(#circuitGradient)" strokeWidth="1.5" opacity="0.7" />
            
            {/* Biểu đồ cột bên trong kính lúp */}
            <rect x="-4" y="2" width="1.5" height="3" fill="url(#circuitGradient)" opacity="0.9" />
            <rect x="-1.5" y="1" width="1.5" height="4" fill="url(#circuitGradient)" opacity="0.9" />
            <rect x="1" y="0.5" width="1.5" height="4.5" fill="url(#circuitGradient)" opacity="0.9" />
            
            {/* Đường ngang */}
            <line x1="-3" y1="-1" x2="3" y2="-1" stroke="url(#circuitGradient)" strokeWidth="0.8" opacity="0.7" />
            <line x1="-2.5" y1="-2.5" x2="2.5" y2="-2.5" stroke="url(#circuitGradient)" strokeWidth="0.8" opacity="0.7" />
            
            {/* Tay cầm kính lúp */}
            <path
              d="M 5 -5 L 9 -7 L 9 -3"
              fill="none"
              stroke="url(#circuitGradient)"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.8"
            />
          </g>
        </svg>
      </div>
      
      {/* Text */}
      <div className="flex items-center">
        <span className="text-2xl font-extrabold bg-gradient-to-r from-[#21A691] to-[#87DF2C] bg-clip-text text-transparent leading-none tracking-tight whitespace-nowrap">
          Test Studio
        </span>
      </div>
    </div>
  );
};

// GoogleIcon giữ nguyên (custom component)
export const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="20" height="20" {...props}>
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);