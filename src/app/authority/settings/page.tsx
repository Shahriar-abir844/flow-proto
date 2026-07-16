import { getSettings } from "@/lib/settings";
import { getDriveStatus } from "@/lib/storage";
import { DriveSettingsForm } from "@/components/DriveSettingsForm";
import { GoogleCredentialsForm } from "@/components/GoogleCredentialsForm";
import { SiteInfoForm } from "@/components/SiteInfoForm";

export default async function AuthoritySettingsPage() {
  const [settings, driveStatus] = await Promise.all([getSettings(), getDriveStatus()]);

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold">Settings</h1>
      <SiteInfoForm
        initialCompanyName={settings.companyName ?? ""}
        initialSupportContact={settings.supportContact ?? ""}
      />
      <GoogleCredentialsForm
        clientIdSet={driveStatus.clientIdSet}
        clientSecretSet={driveStatus.clientSecretSet}
        refreshTokenSet={driveStatus.refreshTokenSet}
      />
      <DriveSettingsForm
        initialLink={settings.driveFolderLink ?? ""}
        driveStatus={driveStatus}
      />
    </div>
  );
}
