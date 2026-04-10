<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="margin:0; padding:0; background-color:#faf7f2; font-family:Georgia, 'Times New Roman', serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#faf7f2; padding:40px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px; width:100%;">

          {{-- Logo / Brand --}}
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <span style="font-size:28px; font-weight:bold; color:#2d2a26; letter-spacing:0.5px;">
                ☕ Kai's Coffee
              </span>
            </td>
          </tr>

          {{-- Card --}}
          <tr>
            <td style="background-color:#ffffff; border-radius:16px; border:1px solid #e8e2d9; padding:40px 36px; box-shadow:0 2px 8px rgba(0,0,0,0.04);">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">

                {{-- Title --}}
                <tr>
                  <td style="font-size:22px; font-weight:bold; color:#2d2a26; padding-bottom:16px;">
                    Reset your password
                  </td>
                </tr>

                {{-- Greeting --}}
                <tr>
                  <td style="font-size:15px; color:#4a4541; line-height:1.6; padding-bottom:8px;">
                    Hi {{ $userName }},
                  </td>
                </tr>

                {{-- Message --}}
                <tr>
                  <td style="font-size:15px; color:#4a4541; line-height:1.6; padding-bottom:28px;">
                    We received a request to reset your password. Click the button below to choose a new one.
                  </td>
                </tr>

                {{-- CTA Button --}}
                <tr>
                  <td align="center" style="padding-bottom:28px;">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="background-color:#c6a15b; border-radius:10px;">
                          <a href="{{ $resetUrl }}" target="_blank" style="display:inline-block; padding:14px 40px; font-size:16px; font-weight:bold; color:#ffffff; text-decoration:none; letter-spacing:0.3px;">
                            Reset Password
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                {{-- Expiry --}}
                <tr>
                  <td style="font-size:13px; color:#8a8580; line-height:1.5; padding-bottom:20px;">
                    This link will expire in <strong style="color:#4a4541;">60 minutes</strong>. If you didn't request a password reset, you can safely ignore this email.
                  </td>
                </tr>

                {{-- Fallback URL --}}
                <tr>
                  <td style="border-top:1px solid #e8e2d9; padding-top:20px; font-size:12px; color:#8a8580; line-height:1.5; word-break:break-all;">
                    If the button doesn't work, copy and paste this link into your browser:<br>
                    <a href="{{ $resetUrl }}" style="color:#c6a15b; text-decoration:underline;">{{ $resetUrl }}</a>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          {{-- Footer --}}
          <tr>
            <td align="center" style="padding-top:28px; font-size:12px; color:#a09890; line-height:1.5;">
              Kai's Coffee &mdash; Made with care<br>
              <span style="font-size:11px;">You're receiving this because a password reset was requested for your account.</span>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
