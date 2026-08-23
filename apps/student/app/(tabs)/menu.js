import MenuScreen from '@/features/menu/presentation/menu-screen';

// Thin route file — the actual screen lives in the menu feature.
// This keeps navigation and feature code decoupled.
export default function MenuRoute() {
  return <MenuScreen />;
}
