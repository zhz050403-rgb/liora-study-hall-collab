using System;
using System.Diagnostics;
using System.IO;
using System.Windows.Forms;

internal static class TodoSetup
{
    private const string Url = "https://liora-study-hall.app.workbuddy.host/todo.html?sharecode=L4NKT6REQ6&pet=1";

    [STAThread]
    private static void Main()
    {
        Application.EnableVisualStyles();
        using (var form = new Form { Text = "学习小屋 · 安装待办", ClientSize = new System.Drawing.Size(460, 205),
            StartPosition = FormStartPosition.CenterScreen, FormBorderStyle = FormBorderStyle.FixedDialog,
            MaximizeBox = false, MinimizeBox = false, AutoScaleMode = AutoScaleMode.Font })
        {
            var guide = new Label { Left = 24, Top = 24, Width = 412, Height = 60,
                Text = "第 1 步 / 共 2 步\r\n安装待办小窗，并在桌面创建打开入口。" };
            var startup = new CheckBox { Left = 24, Top = 92, Width = 410, Text = "登录 Windows 后自动打开待办" };
            var next = new Button { Left = 306, Top = 147, Width = 130, Height = 32, Text = "安装" };
            string launcher = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "LioraTodoPet", "Open-Todo.cmd");
            bool installed = false;
            next.Click += delegate
            {
                try
                {
                    if (installed)
                    {
                        Process.Start(new ProcessStartInfo(launcher) { UseShellExecute = true, WindowStyle = ProcessWindowStyle.Hidden });
                        form.Close();
                        return;
                    }
                    Directory.CreateDirectory(Path.GetDirectoryName(launcher));
                    File.WriteAllText(launcher, Launcher);
                    CreateShortcut(Environment.SpecialFolder.DesktopDirectory, launcher);
                    if (startup.Checked)
                        CreateShortcut(Environment.SpecialFolder.Startup, launcher);

                    installed = true;
                    guide.Text = "第 2 步 / 共 2 步\r\n安装完成。打开后如看到登录页，请使用原学习小屋账号。";
                    startup.Visible = false;
                    next.Text = "打开待办";
                }
                catch (Exception ex)
                {
                    MessageBox.Show(form, ex.Message, "待办安装", MessageBoxButtons.OK, MessageBoxIcon.Error);
                }
            };
            form.Controls.AddRange(new Control[] { guide, startup, next });
            form.AcceptButton = next;
            Application.Run(form);
        }
    }

    private static void CreateShortcut(Environment.SpecialFolder folder, string target)
    {
        string path = Path.Combine(Environment.GetFolderPath(folder), "学习小屋待办.lnk");
        dynamic shell = Activator.CreateInstance(Type.GetTypeFromProgID("WScript.Shell"));
        dynamic shortcut = shell.CreateShortcut(path);
        shortcut.TargetPath = target;
        shortcut.WindowStyle = 7;
        shortcut.Save();
    }

    private const string Launcher = @"@echo off
setlocal
set ""browser=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe""
if not exist ""%browser%"" set ""browser=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe""
if not exist ""%browser%"" set ""browser=%ProgramFiles%\Google\Chrome\Application\chrome.exe""
if not exist ""%browser%"" set ""browser=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe""
if not exist ""%browser%"" (
  echo Microsoft Edge or Google Chrome was not found.
  pause
  exit /b 1
)
start """" ""%browser%"" --user-data-dir=""%LOCALAPPDATA%\LioraTodoPet\EdgeProfile"" --app=""" + Url + @""" --window-size=360,520 --no-first-run --no-default-browser-check
";
}
