# 学习小屋 · 桌面待办小组件启动器（Windows，免安装）
# 由 START-HERE.cmd 调用。作用：用本机 Edge/Chrome 开一块无边框、置顶、
# 圆角的小卡片，常驻桌面右下角；并把它加入开机自启，以后开机自动出现。
# 页面仍加载线上网站，共用同一个浏览器账号与云同步，所以待办与网站完全互通。

$ErrorActionPreference = 'SilentlyContinue'

$Url = 'https://liora-study-hall.app.workbuddy.host/todo.html?sharecode=L4NKT6REQ6&pet=1'
$Width = 340
$Height = 520

# ---------- 1. 找浏览器 ----------
$candidates = @(
  'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',
  'C:\Program Files\Microsoft\Edge\Application\msedge.exe',
  'C:\Program Files\Google\Chrome\Application\chrome.exe',
  'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe'
)
$exe = $candidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
if (-not $exe) {
  Add-Type -AssemblyName System.Windows.Forms
  [void][System.Windows.Forms.MessageBox]::Show(
    '没有找到 Edge 或 Chrome 浏览器。请先安装 Edge，然后重新双击 START-HERE.cmd。',
    '学习小屋 · 桌面待办')
  exit 1
}

# ---------- 2. 窗口控制所需的 Win32 API ----------
# 枚举逻辑全部放在 C# 里，避免 PowerShell 委托回调的作用域问题。
Add-Type @'
using System;
using System.Text;
using System.Collections.Generic;
using System.Runtime.InteropServices;
public class LioraPetWin {
  public delegate bool EnumProc(IntPtr h, IntPtr l);
  [DllImport("user32.dll")] public static extern bool EnumWindows(EnumProc cb, IntPtr l);
  [DllImport("user32.dll")] public static extern int GetWindowText(IntPtr h, StringBuilder s, int n);
  [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr h);
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
  [DllImport("user32.dll")] public static extern bool SetWindowPos(IntPtr hwnd, IntPtr after, int x, int y, int w, int cy, uint f);
  [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hwnd, int cmd);
  [DllImport("user32.dll")] public static extern int GetWindowLong(IntPtr h, int i);
  [DllImport("user32.dll")] public static extern int SetWindowLong(IntPtr h, int i, int v);
  [DllImport("user32.dll")] public static extern IntPtr CreateRoundRectRgn(int a, int b, int c, int d, int e, int f);
  [DllImport("user32.dll")] public static extern int SetWindowRgn(IntPtr h, IntPtr r, bool redraw);

  public static long[] ListVisible() {
    var a = new List<long>();
    EnumWindows(delegate(IntPtr h, IntPtr l) {
      if (IsWindowVisible(h)) a.Add(h.ToInt64());
      return true;
    }, IntPtr.Zero);
    return a.ToArray();
  }
  // 找启动之后新出现的浏览器窗口；不依赖窗口标题，登录页也能识别
  public static IntPtr FindNew(uint[] pids, long[] exclude) {
    IntPtr found = IntPtr.Zero;
    EnumWindows(delegate(IntPtr h, IntPtr l) {
      if (!IsWindowVisible(h)) return true;
      uint pid; GetWindowThreadProcessId(h, out pid);
      bool isBrowser = false;
      if (pids != null) foreach (uint p in pids) { if (p == pid) { isBrowser = true; break; } }
      if (!isBrowser) return true;
      long hv = h.ToInt64();
      if (exclude != null) foreach (long e in exclude) { if (e == hv) return true; }
      found = h;
      return true;
    }, IntPtr.Zero);
    return found;
  }
  public static IntPtr FindByTitle(string kw, long[] exclude) {
    IntPtr found = IntPtr.Zero;
    EnumWindows(delegate(IntPtr h, IntPtr l) {
      if (!IsWindowVisible(h)) return true;
      var sb = new StringBuilder(512); GetWindowText(h, sb, 512);
      if (sb.ToString().IndexOf(kw, StringComparison.Ordinal) < 0) return true;
      long hv = h.ToInt64();
      if (exclude != null) foreach (long e in exclude) { if (e == hv) return true; }
      found = h; return false;
    }, IntPtr.Zero);
    return found;
  }
  // 精确标题匹配：用于找已经打开的小卡片窗口，不会误改浏览器主窗口
  public static IntPtr FindExactTitle(string title) {
    IntPtr found = IntPtr.Zero;
    EnumWindows(delegate(IntPtr h, IntPtr l) {
      if (!IsWindowVisible(h)) return true;
      var sb = new StringBuilder(512); GetWindowText(h, sb, 512);
      if (string.Equals(sb.ToString(), title, StringComparison.Ordinal)) { found = h; return false; }
      return true;
    }, IntPtr.Zero);
    return found;
  }
  public static string Title(IntPtr h) {
    var sb = new StringBuilder(512); GetWindowText(h, sb, 512); return sb.ToString();
  }
}
'@

# ---------- 3. 已经有小卡片就直接复用；没有才启动一个新的 ----------
$hwnd = [LioraPetWin]::FindExactTitle('学习小屋 · 待办')
if ($hwnd -eq [IntPtr]::Zero) { $hwnd = [LioraPetWin]::FindExactTitle('登录 · Liora 的学习小屋') }
if ($hwnd -eq [IntPtr]::Zero) {
  # 记录启动前已有的窗口，避免误改浏览器主窗口
  $before = [LioraPetWin]::ListVisible()
  if ($null -eq $before) { $before = [long[]]@() }

  # 必须用独立的浏览器配置：否则 Edge 已运行时 --app 只会变成普通标签页，
  # 得不到能常驻桌面的独立小窗。这个配置只属于小组件，第一次登录后一直记住。
  $profileDir = Join-Path $env:LOCALAPPDATA 'LioraTodoPet\EdgeProfile'
  if (-not (Test-Path -LiteralPath $profileDir)) {
    New-Item -ItemType Directory -Path $profileDir -Force | Out-Null
  }
  Start-Process -FilePath $exe -ArgumentList @(
    ('--user-data-dir="' + $profileDir + '"'),
    ('--app=' + $Url),
    ('--window-size=' + $Width + ',' + $Height),
    '--no-first-run',
    '--no-default-browser-check'
  ) | Out-Null

  # 等窗口出现（最多约 16 秒）：只认学习小屋的页面窗口，
  # 不能抓 Edge 启动过程中的临时加载窗口（那种窗口几秒后就会消失）
  for ($i = 0; $i -lt 45 -and $hwnd -eq [IntPtr]::Zero; $i++) {
    Start-Sleep -Milliseconds 350
    foreach ($kw in @('待办', '学习小屋', '登录')) {
      $cand = [LioraPetWin]::FindByTitle($kw, $before)
      if ($cand -eq [IntPtr]::Zero) { continue }
      $t = [LioraPetWin]::Title($cand)
      if ($t -notlike '*和另外*' -and $t -notlike '*- 个人 -*') { $hwnd = $cand; break }
    }
  }
  # 兜底：Edge 复用了已有窗口时，按精确标题找回（不会误改主窗口）
  if ($hwnd -eq [IntPtr]::Zero) { $hwnd = [LioraPetWin]::FindExactTitle('学习小屋 · 待办') }
  if ($hwnd -eq [IntPtr]::Zero) { $hwnd = [LioraPetWin]::FindExactTitle('登录 · Liora 的学习小屋') }
}

# ---------- 6. 去掉边框、置顶、圆角、摆到右下角 ----------
if ($hwnd -ne [IntPtr]::Zero) {
  # SW_RESTORE：被「显示桌面」一起最小化后，重新运行也能把小卡片唤回来
  [void][LioraPetWin]::ShowWindow($hwnd, 9)
  Add-Type -AssemblyName System.Windows.Forms
  $wa = [System.Windows.Forms.Screen]::PrimaryScreen.WorkingArea
  $x = [Math]::Max($wa.Left + 8, $wa.Right - $Width - 16)
  $y = [Math]::Max($wa.Top + 8, $wa.Bottom - $Height - 12)

  $GWL_STYLE = -16
  $WS_CAPTION = 0x00C00000
  $WS_THICKFRAME = 0x00040000
  $WS_MINIMIZEBOX = 0x00020000
  $WS_MAXIMIZEBOX = 0x00010000
  $remove = $WS_CAPTION -bor $WS_THICKFRAME -bor $WS_MINIMIZEBOX -bor $WS_MAXIMIZEBOX
  $style = [LioraPetWin]::GetWindowLong($hwnd, $GWL_STYLE)
  [void][LioraPetWin]::SetWindowLong($hwnd, $GWL_STYLE, ($style -band (-bnot $remove)))

  # HWND_TOPMOST = -1；SWP_SHOWWINDOW(0x40) | SWP_FRAMECHANGED(0x20)
  [void][LioraPetWin]::SetWindowPos($hwnd, [IntPtr](-1), $x, $y, $Width, $Height, [uint32]0x0060)
  $rgn = [LioraPetWin]::CreateRoundRectRgn(0, 0, $Width + 1, $Height + 1, 18, 18)
  [void][LioraPetWin]::SetWindowRgn($hwnd, $rgn, $true)
}

# ---------- 7. 开机自动出现（重复运行只会覆盖同一个启动项） ----------
$runKey = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Run'
$cmdPath = Join-Path $PSScriptRoot 'START-HERE.cmd'
if (Test-Path -LiteralPath $cmdPath) {
  Set-ItemProperty -Path $runKey -Name 'LioraTodoPet' -Value ('"' + $cmdPath + '"') -Force
}
