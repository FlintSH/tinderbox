local defaults = require("./lua/defaults.lua")
local home = defaults.home
local scripts = home .. "/.config/hypr/scripts"
local fallback_wallpaper = home .. "/Pictures/wallpapers/blue-bg.gif"

hl.on("hyprland.start", function()
    hl.exec_cmd(home .. "/.config/hypr/initial-boot.sh")
    -- Wallpaper.sh validates the saved path/backend and atomically persists the
    -- readable blue GIF fallback through awww when restoration is unavailable.
    hl.exec_cmd("test -r " .. fallback_wallpaper .. " || notify-send -u critical 'Wallpaper' 'Fallback blue-bg.gif is unreadable'")
    hl.exec_cmd(scripts .. "/Wallpaper.sh restore")
    hl.exec_cmd("dbus-update-activation-environment --systemd WAYLAND_DISPLAY XDG_CURRENT_DESKTOP")
    hl.exec_cmd("systemctl --user import-environment WAYLAND_DISPLAY XDG_CURRENT_DESKTOP")
    hl.exec_cmd(scripts .. "/Polkit.sh")
    hl.exec_cmd("nm-applet --indicator")
    hl.exec_cmd("swaync")
    hl.exec_cmd("waybar")
    hl.exec_cmd("qs")
    hl.exec_cmd("wl-paste --type text --watch cliphist store")
    hl.exec_cmd("wl-paste --type image --watch cliphist store")
    hl.exec_cmd("hypridle")
    hl.exec_cmd("sleep 3 && openrgb --profile fl1nt")
end)
