function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function getRegistrationEmailTemplate(roleLabel: string): string {
  const safeRoleLabel = escapeHtml(roleLabel);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Hope-Care</title>
</head>

<body style="
  margin: 0;
  padding: 0;
  background-color: #f5f7fa;
  font-family: Arial, Helvetica, sans-serif;
  color: #172033;
">

<table
  role="presentation"
  width="100%"
  cellspacing="0"
  cellpadding="0"
  border="0"
  style="background-color: #f5f7fa;"
>
  <tr>
    <td align="center" style="padding: 40px 16px;">

      <!-- Email Card -->
      <table
        role="presentation"
        width="100%"
        cellspacing="0"
        cellpadding="0"
        border="0"
        style="
          max-width: 600px;
          background-color: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 14px;
        "
      >

        <!-- Brand -->
        <tr>
          <td style="padding: 30px 36px 10px;">

            <table
              role="presentation"
              cellspacing="0"
              cellpadding="0"
              border="0"
            >
              <tr>

                <td
                  valign="middle"
                  style="
                    width: 42px;
                    height: 42px;
                    background-color: #1769e0;
                    border-radius: 10px;
                    text-align: center;
                    color: #ffffff;
                    font-size: 22px;
                    font-weight: bold;
                  "
                >
                  +
                </td>

                <td style="padding-left: 12px;">

                  <div style="
                    color: #172033;
                    font-size: 20px;
                    font-weight: 700;
                    line-height: 26px;
                  ">
                    Hope-Care
                  </div>

                  <div style="
                    color: #8a94a6;
                    font-size: 11px;
                    line-height: 16px;
                  ">
                    Care. Support. Hope.
                  </div>

                </td>

              </tr>
            </table>

          </td>
        </tr>

        <!-- Divider -->
        <tr>
          <td style="padding: 18px 36px 0;">
            <div style="
              height: 1px;
              background-color: #edf0f3;
            "></div>
          </td>
        </tr>

        <!-- Main Content -->
        <tr>
          <td style="padding: 35px 36px 30px;">

            <p style="
              margin: 0 0 20px;
              font-size: 16px;
              line-height: 26px;
              color: #172033;
            ">
              Hello there,
            </p>

            <h1 style="
              margin: 0 0 14px;
              font-size: 24px;
              line-height: 32px;
              font-weight: 700;
              color: #172033;
            ">
              Welcome to Hope-Care
            </h1>

            <p style="
              margin: 0 0 24px;
              font-size: 15px;
              line-height: 25px;
              color: #667085;
            ">
              Your account has been successfully created and activated.
              We're happy to have you with us.
            </p>

            <!-- Account Status -->
            <table
              role="presentation"
              width="100%"
              cellspacing="0"
              cellpadding="0"
              border="0"
              style="
                background-color: #f8fafc;
                border: 1px solid #e6eaf0;
                border-radius: 10px;
              "
            >
              <tr>
                <td style="padding: 18px 20px;">

                  <table
                    role="presentation"
                    cellspacing="0"
                    cellpadding="0"
                    border="0"
                  >
                    <tr>

                      <td
                        valign="middle"
                        style="
                          width: 30px;
                          height: 30px;
                          background-color: #dcfce7;
                          border-radius: 50%;
                          text-align: center;
                          color: #15803d;
                          font-size: 15px;
                          font-weight: bold;
                        "
                      >
                        ✓
                      </td>

                      <td style="padding-left: 12px;">

                        <div style="
                          font-size: 13px;
                          font-weight: 700;
                          color: #344054;
                          margin-bottom: 3px;
                        ">
                          Account Activated
                        </div>

                        <div style="
                          font-size: 12px;
                          color: #667085;
                          line-height: 18px;
                        ">
                          Your Hope-Care account is ready to use.
                        </div>

                      </td>

                    </tr>
                  </table>

                </td>
              </tr>
            </table>



            <!-- Message -->
            <p style="
              margin: 26px 0 0;
              font-size: 15px;
              line-height: 25px;
              color: #667085;
            ">
              You can now sign in to your account and start using
              Hope-Care. We look forward to supporting you throughout
              your journey.
            </p>

            <!-- Button -->
            <table
              role="presentation"
              cellspacing="0"
              cellpadding="0"
              border="0"
              style="margin: 28px 0 0;"
            >
              <tr>
                <td>

                  <a
                    href="https://hope-care.com"
                    style="
                      display: inline-block;
                      padding: 12px 24px;
                      background-color: #1769e0;
                      color: #ffffff;
                      text-decoration: none;
                      border-radius: 8px;
                      font-size: 14px;
                      font-weight: 700;
                    "
                  >
                    Sign In to Hope-Care
                  </a>

                </td>
              </tr>
            </table>

            <!-- Security -->
            <table
              role="presentation"
              width="100%"
              cellspacing="0"
              cellpadding="0"
              border="0"
              style="margin-top: 30px;"
            >
              <tr>
                <td style="
                  padding: 14px 16px;
                  border-left: 3px solid #d0d5dd;
                  background-color: #fafafa;
                ">

                  <p style="
                    margin: 0;
                    font-size: 12px;
                    line-height: 19px;
                    color: #667085;
                  ">
                    <strong style="color: #344054;">
                      Didn't create this account?
                    </strong>
                    Please contact our support team immediately.
                  </p>

                </td>
              </tr>
            </table>

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="
            padding: 22px 36px;
            border-top: 1px solid #edf0f3;
            text-align: center;
          ">

            <p style="
              margin: 0 0 5px;
              font-size: 12px;
              font-weight: 600;
              color: #667085;
            ">
              Hope Care by Techco V
            </p>

            <p style="
              margin: 0;
              font-size: 11px;
              line-height: 18px;
              color: #98a2b3;
            ">
              © ${new Date().getFullYear()} Hope Care by Techco V.
              All rights reserved.
            </p>

            <p style="
              margin: 7px 0 0;
              font-size: 11px;
              color: #98a2b3;
            ">
              This is an automated email. Please do not reply.
            </p>

          </td>
        </tr>

      </table>

    </td>
  </tr>
</table>

</body>
</html>
  `;
}
