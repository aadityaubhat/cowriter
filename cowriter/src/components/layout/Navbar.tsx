import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { Tab } from '@/types';

interface NavbarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export function Navbar({ activeTab, onTabChange }: NavbarProps) {
  return (
    <nav className="border-b bg-background">
      <div className="flex h-14 items-center px-4">
        <span className="mr-8 text-lg font-bold">CoWriter</span>

        <Button
          variant="ghost"
          className={`${activeTab === 'write' ? 'bg-muted' : ''}`}
          onClick={() => onTabChange('write')}
        >
          Write
        </Button>
        <Button
          variant="ghost"
          className={`${activeTab === 'configure' ? 'bg-muted' : ''}`}
          onClick={() => onTabChange('configure')}
        >
          Configure
        </Button>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
