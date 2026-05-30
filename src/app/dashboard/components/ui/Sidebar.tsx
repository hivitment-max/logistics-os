'use client'

import { useState, useEffect } from 'react'

interface MenuItem {
  id: string
  icon: string
  label: string
}

interface MenuGroup {
  category: string
  items: MenuItem[]
}

interface SidebarProps {
  menuStructure: MenuGroup[]
  activeTab: string
  onTabChange: (tabId: string) => void
  currentUser: any
  onSignOut: () => void
  isAdmin: boolean
  collapsed: boolean
  onToggleCollapse: () => void
}

export default function Sidebar({
  menuStructure,
  activeTab,
  onTabChange,
  currentUser,
  onSignOut,
  isAdmin,
  collapsed,
  onToggleCollapse,
}: SidebarProps) {
  return (
    <aside
      className={`${
        collapsed ? 'w-16' : 'w-52'
      } bg-gray-900 border-r border-gray-800 flex flex-col shrink-0 transition-all duration-300 overflow-hidden`}
    >
      {/* Header with toggle button */}
      <div className="h-11 flex items-center px-3 border-b border-gray-800">
        <button
          onClick={onToggleCollapse}
          className="p-1 hover:bg-gray-800 rounded transition text-gray-400 hover:text-white shrink-0"
          title={collapsed ? 'გაშლა' : 'შეკეცვა'}
        >
          {collapsed ? '▶' : '◀'}
        </button>
        {!collapsed && (
          <span className="text-xs font-bold text-blue-400 tracking-wide ml-2 truncate">
            🚛 LOGISTICS OS
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 px-1.5 space-y-0.5">
        {menuStructure.map((group) => (
          <div key={group.category} className="mb-2">
            {!collapsed && (
              <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest px-2 mb-1 truncate">
                {group.category}
              </p>
            )}
            {group.items.map((item) => (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md transition-all text-[11px] ${
                  activeTab === item.id
                    ? 'bg-blue-600/90 text-white shadow-sm'
                    : 'text-gray-500 hover:bg-gray-800/60 hover:text-gray-300'
                } ${collapsed ? 'justify-center' : ''}`}
                title={collapsed ? item.label : undefined}
              >
                <span className="text-sm w-4 text-center shrink-0">{item.icon}</span>
                {!collapsed && <span className="truncate">{item.label}</span>}
              </button>
            ))}
          </div>
        ))}
      </nav>

      {/* User section */}
      <div className="p-3 border-t border-gray-800 shrink-0">
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} gap-2`}>
          <div className={`flex items-center gap-2 ${collapsed ? '' : 'min-w-0'}`}>
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-yellow-400 to-orange-500 flex items-center justify-center text-[10px] font-bold shadow-md shrink-0">
              A
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-medium truncate text-gray-300">
                  {currentUser?.email || 'admin@logistics.ge'}
                </p>
              </div>
            )}
          </div>
          {!collapsed && (
            <button
              onClick={onSignOut}
              className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded-lg transition shrink-0"
              title="გასვლა"
            >
              🚪
            </button>
          )}
        </div>
      </div>
    </aside>
  )
}