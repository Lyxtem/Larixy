// SPDX-License-Identifier: AGPL-3.0-or-later

package cmd

import (
	"errors"
	"io"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/Lyxtem/larixy/larixy_rexctl/internal/instance"
	"github.com/Lyxtem/larixy/larixy_rexctl/internal/ui"
)

func TestSudoCommand(t *testing.T) {
	cases := []struct {
		name string
		exe  string
		args []string
		dir  string
		want string
	}{
		{"home install keeps its full path", "/home/u/.local/bin/rexctl", []string{"migrate", "--experimental-native"}, "/home/u/larixy", "sudo /home/u/.local/bin/rexctl migrate --experimental-native --dir /home/u/larixy"},
		{"sudo finds rexctl by name", "/usr/bin/rexctl", []string{"status"}, "/opt/larixy", "sudo rexctl status --dir /opt/larixy"},
		{"names /usr/local/bin, which some sudo setups skip", "/usr/local/bin/rexctl", []string{"status"}, "/opt/larixy", "sudo /usr/local/bin/rexctl status --dir /opt/larixy"},
		{"leaves out a binary in the temporary folder", filepath.Join(os.TempDir(), "x", "out", "rexctl"), []string{"status"}, "", "sudo rexctl status"},
		{"keeps the folder the user passed", "/home/u/.local/bin/rexctl", []string{"install", "--experimental-native", "--dir", "x", "--domain", "chat.example.org"}, "/opt/larixy", "sudo /home/u/.local/bin/rexctl install --experimental-native --dir x --domain chat.example.org"},
		{"keeps --dir=", "/usr/bin/rexctl", []string{"backup", "--dir=/srv/larixy"}, "/srv/larixy", "sudo rexctl backup --dir=/srv/larixy"},
		{"no instance yet", "/usr/bin/rexctl", []string{"install", "--experimental-native"}, "", "sudo rexctl install --experimental-native"},
		{"quotes what the shell would split", "/home/my user/bin/rexctl", []string{"config", "set", "x=it's here"}, "/home/my user/larixy", `sudo '/home/my user/bin/rexctl' config set 'x=it'\''s here' --dir '/home/my user/larixy'`},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			if got := sudoCommand(c.exe, c.args, c.dir); got != c.want {
				t.Fatalf("got %q, want %q", got, c.want)
			}
		})
	}
}

func TestConfigSetHintLeavesOutValues(t *testing.T) {
	got := configSetFlags([]string{"storage.secret_key=hunter2", "--dir", "/opt/larixy", "--yes", "smtp.password", "hunter3"})
	want := []string{"config", "set", "--dir", "/opt/larixy", "--yes"}
	if strings.Join(got, " ") != strings.Join(want, " ") {
		t.Fatalf("got %q, want %q", got, want)
	}
}

func TestDefaultNativeDir(t *testing.T) {
	cases := map[string]string{
		"/home/u/larixy": "/opt/larixy",
		"/opt/larixy":    "/opt/larixy-native",
	}
	if os.Geteuid() != 0 {
		cases[t.TempDir()] = "/opt/larixy"
	}
	for dir, want := range cases {
		if got := defaultNativeDir(&instance.Instance{Dir: dir}); got != want {
			t.Errorf("for %s got %s, want %s", dir, got, want)
		}
	}
}

func TestUntrustedRefusal(t *testing.T) {
	cases := []struct {
		name string
		err  *instance.UntrustedError
		msg  string
		fix  string
	}{
		{"found under a folder others can change", &instance.UntrustedError{Path: "/home/u", Dir: "/home/u/larixy", Shared: true}, "other accounts can change /home/u, so root doesn't use it on its own", "pass --dir /home/u/larixy."},
		{"instance folder others can change", &instance.UntrustedError{Path: "/mnt/user/appdata/larixy", Dir: "/mnt/user/appdata/larixy", Shared: true, Inside: true}, "Other accounts can change /mnt/user/appdata/larixy, so root doesn't use the instance in it.", "chmod go-w /mnt/user/appdata/larixy,"},
		{"state folder others can change", &instance.UntrustedError{Path: "/srv/larixy/.rexctl", Dir: "/srv/larixy", Shared: true, Inside: true}, "Other accounts can change /srv/larixy/.rexctl, so root doesn't use the instance in /srv/larixy.", "chmod go-w /srv/larixy/.rexctl,"},
		{"link in a folder others can change", &instance.UntrustedError{Path: "/srv/shared", Dir: "/srv/shared/larixy", Shared: true, Link: "/srv/shared/larixy"}, "/srv/shared/larixy is a link in /srv/shared", "Pass --dir"},
		{"another owner", &instance.UntrustedError{Path: "/home/v/larixy", Dir: "/home/v/larixy"}, "another account owns /home/v/larixy", "pass --dir /home/v/larixy."},
		{"record file", &instance.UntrustedError{Path: "/etc/rexctl"}, "Accounts other than root can change /etc/rexctl", "Make root its owner"},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			var ee *ui.ExitError
			if !errors.As(untrustedRefusal(c.err), &ee) || !strings.Contains(ee.Msg, c.msg) || !strings.Contains(ee.Fix, c.fix) {
				t.Fatalf("got %+v, want %q and %q", ee, c.msg, c.fix)
			}
		})
	}
}

func TestMovedRefusalPointsAtTheNewInstance(t *testing.T) {
	r := movedRefusal(&instance.MovedError{Dir: "/home/u/larixy", To: "/opt/larixy"})
	if !strings.Contains(r.Msg, "/opt/larixy") || !strings.HasSuffix(r.Fix, "status --dir /opt/larixy.") || !strings.Contains(r.Fix, "sudo ") {
		t.Fatalf("got %q and %q", r.Msg, r.Fix)
	}
}

func TestMarkMovedRecordsTheNewFolder(t *testing.T) {
	old := instance.MachineRecordPath
	t.Cleanup(func() { instance.MachineRecordPath = old })
	instance.MachineRecordPath = filepath.Join(t.TempDir(), "etc", instance.RecordFileName)
	dir := t.TempDir()
	if err := os.MkdirAll(filepath.Join(dir, instance.StateDirName), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(dir, instance.StateDirName, instance.StateFileName), []byte(`{"schema":6,"project":"larixy","runtime":"compose"}`), 0o600); err != nil {
		t.Fatal(err)
	}
	app := &App{UI: ui.New(ui.Options{Stdout: io.Discard, Stderr: io.Discard})}
	markMoved(app, &instance.Instance{Dir: dir}, "/opt/larixy")
	got, err := instance.Find(dir)
	if err != nil || got.State.MovedTo != "/opt/larixy" {
		t.Fatalf("got %+v, %v, want the state to name /opt/larixy", got, err)
	}
}
