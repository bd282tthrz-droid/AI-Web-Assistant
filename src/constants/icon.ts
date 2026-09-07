// 图标集中管理：所有 react-icons 必须通过此文件导入
// 按需分模块导入，禁止全量导入
// 所有图标名称已通过 node_modules/react-icons/fa6/index.d.ts 核验

import {
  FaRobot,
  FaPaperPlane,
  FaXmark,
  FaCircleNotch,
  FaHouse,
  FaCartPlus,
  FaGear,
  FaArrowRight,
  FaMagnifyingGlass,
  FaBars,
  FaTrashCan,
  FaChevronDown,
  FaCircleCheck,
  FaCircleExclamation,
  FaWandMagicSparkles,
  FaRegMessage,
  FaRegCopy,
  FaUser,
  FaHeart,
  FaTag,
  FaStar,
  FaPlus,
  FaMinus,
} from 'react-icons/fa6'

export const ICONS = {
  // AI 助手相关
  robot: FaRobot,
  wandMagic: FaWandMagicSparkles,

  // 聊天交互
  paperPlane: FaPaperPlane,
  message: FaRegMessage,
  copy: FaRegCopy,

  // 界面操作
  close: FaXmark,
  menu: FaBars,
  chevronDown: FaChevronDown,
  settings: FaGear,

  // 状态反馈
  loading: FaCircleNotch,
  success: FaCircleCheck,
  error: FaCircleExclamation,

  // 页面操作
  home: FaHouse,
  cartPlus: FaCartPlus,
  search: FaMagnifyingGlass,
  arrowRight: FaArrowRight,
  trash: FaTrashCan,

  // Mock 宿主页面专用
  user: FaUser,
  heart: FaHeart,
  tag: FaTag,
  star: FaStar,
  plus: FaPlus,
  minus: FaMinus,
} as const
