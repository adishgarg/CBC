
interface WhatsAppMessage {
  messaging_product: "whatsapp";
  to: string;
  type: "template" | "text";
  template?: {
    name: string;
    language: {
      code: string;
    };
    components?: Array<{
      type: "body";
      parameters: Array<{
        type: "text";
        text: string;
      }>;
    }>;
  };
  text?: {
    preview_url: boolean;
    body: string;
  };
}

const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN?.trim();
const DEFAULT_COUNTRY_CODE = process.env.WHATSAPP_DEFAULT_COUNTRY_CODE || "91";
const WHATSAPP_USE_CUSTOM_MESSAGES = false;
const WHATSAPP_TEMPLATE_LANGUAGE = "en";
const WHATSAPP_TEMPLATE_LANGUAGE_FALLBACK =
  WHATSAPP_TEMPLATE_LANGUAGE === "en"
    ? "en_US"
    : WHATSAPP_TEMPLATE_LANGUAGE === "en_US"
      ? "en"
      : undefined;

// Active approved templates.
const WHATSAPP_TEMPLATE_GREETING = process.env.WHATSAPP_TEMPLATE_GREETING || "greeting";
const WHATSAPP_TEMPLATE_NOTIFICATION = process.env.WHATSAPP_TEMPLATE_NOTIFICATION || "notification";

const WHATSAPP_API_URL = WHATSAPP_PHONE_NUMBER_ID
  ? `https://graph.facebook.com/v22.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`
  : undefined;

function normalizePhoneNumber(phoneNumber: string): string {
  if (!phoneNumber || typeof phoneNumber !== "string") {
    return "";
  }

  let sanitizedPhone = phoneNumber.trim().replace(/\D/g, "");

  if (sanitizedPhone.length === 10) {
    sanitizedPhone = `${DEFAULT_COUNTRY_CODE}${sanitizedPhone}`;
  } else if (sanitizedPhone.length === 12 && !sanitizedPhone.startsWith("91")) {
    sanitizedPhone = `1${sanitizedPhone.slice(2)}`;
  }

  return sanitizedPhone;
}

function isProbablyValidPhoneNumber(phoneNumber: string): boolean {
  // WhatsApp expects a full international number in digits only.
  return /^\d{10,15}$/.test(phoneNumber);
}

function getExpectedTemplateParamCount(error: any): number | undefined {
  const details = error?.error?.error_data?.details;
  if (typeof details !== "string") return undefined;

  const match = details.match(/expected number of params \((\d+)\)/i);
  if (!match) return undefined;

  const parsed = Number.parseInt(match[1], 10);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function sanitizeTemplateParamText(value: string): string {
  // WhatsApp template variables cannot contain newlines/tabs or very long runs of spaces.
  return value
    .replace(/[\r\n\t]+/g, " ")
    .replace(/ {5,}/g, "    ")
    .trim();
}

function uniquePhoneNumbers(phoneNumbers: Array<string | undefined | null>): string[] {
  return [...new Set(
    phoneNumbers
      .map((phone) => (typeof phone === "string" ? phone.trim() : ""))
      .filter((phone) => phone.length > 0)
  )];
}

async function buildRecipientList(
  clientPhoneNumbers: string[],
  teamPhoneNumbers: string[] = []
): Promise<string[]> {
  return uniquePhoneNumbers([...clientPhoneNumbers, ...teamPhoneNumbers]);
}

async function postWhatsAppCustomMessage(
  to: string,
  messageBody: string
): Promise<{ success: boolean; error?: any }> {
  const messagePayload: WhatsAppMessage = {
    messaging_product: "whatsapp",
    to,
    type: "text",
    text: {
      preview_url: false,
      body: messageBody,
    },
  };

  const response = await fetch(WHATSAPP_API_URL!, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(messagePayload),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error(`[WhatsApp] API error for custom message to ${to}:`, error);
    return { success: false, error };
  }

  const result = await response.json();
  console.log(`[WhatsApp] Custom message sent successfully to ${to}:`, result);
  return { success: true };
}

async function postWhatsAppTemplateMessage(
  to: string,
  templateName: string,
  templateParams: string[] = [],
  languageCode: string = WHATSAPP_TEMPLATE_LANGUAGE
): Promise<{ success: boolean; error?: any }> {
  const messagePayload: WhatsAppMessage = {
    messaging_product: "whatsapp",
    to,
    type: "template",
    template: {
      name: templateName,
      language: {
        code: languageCode,
      },
    },
  };

  if (templateParams.length > 0) {
    messagePayload.template!.components = [
      {
        type: "body",
        parameters: templateParams.map((value) => ({
          type: "text",
          text: sanitizeTemplateParamText(value),
        })),
      },
    ];
  }

  const response = await fetch(WHATSAPP_API_URL!, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(messagePayload),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error(`[WhatsApp] API error for ${to} (language: ${languageCode}):`, error);
    return { success: false, error };
  }

  const result = await response.json();
  console.log(`[WhatsApp] Message sent successfully to ${to} (language: ${languageCode}):`, result);
  return { success: true };
}

export async function sendWhatsAppMessage(
  phoneNumber: string,
  message: string,
  options?: { templateName?: string; templateParams?: string[] }
): Promise<boolean> {
  if (!WHATSAPP_PHONE_NUMBER_ID || !WHATSAPP_ACCESS_TOKEN) {
    console.warn("WhatsApp credentials not configured");
    console.warn(`Phone ID configured: ${Boolean(WHATSAPP_PHONE_NUMBER_ID)}, Token configured: ${Boolean(WHATSAPP_ACCESS_TOKEN)}`);
    return false;
  }

  try {
    const formattedPhone = normalizePhoneNumber(phoneNumber);
    if (!formattedPhone || !isProbablyValidPhoneNumber(formattedPhone)) {
      console.warn(`[WhatsApp] Skipping invalid recipient phone number: ${phoneNumber}`);
      return false;
    }

    // If custom messages are enabled and a message is provided, try text first.
    // If it fails (for example outside the 24h customer window), fall back to template.
    if (WHATSAPP_USE_CUSTOM_MESSAGES && message && message.trim()) {
      console.log(`[WhatsApp] Sending custom text message to ${phoneNumber} (formatted: ${formattedPhone})...`);
      const customResult = await postWhatsAppCustomMessage(formattedPhone, message);
      if (customResult.success) {
        return true;
      }

      console.warn(
        `[WhatsApp] Custom message failed for ${formattedPhone}; falling back to template message.`
      );
    }

    // Otherwise, use template message
    const templateName = options?.templateName || WHATSAPP_TEMPLATE_NOTIFICATION;
    const templateParams = options?.templateParams || [];

    console.log(`[WhatsApp] Sending template message to ${phoneNumber} (formatted: ${formattedPhone})...`);
    console.log(`[WhatsApp] API URL: ${WHATSAPP_API_URL}`);
    console.log(`[WhatsApp] Template: ${templateName}`);

    // First attempt with configured language
    const firstAttempt = await postWhatsAppTemplateMessage(
      formattedPhone,
      templateName,
      templateParams,
      WHATSAPP_TEMPLATE_LANGUAGE
    );
    if (firstAttempt.success) return true;

    // If template/language variant not found, retry with en <-> en_US fallback
    const languageMismatchErrorCode = firstAttempt.error?.error?.code;
    if (languageMismatchErrorCode === 132001 && WHATSAPP_TEMPLATE_LANGUAGE_FALLBACK) {
      console.log(
        `[WhatsApp] Retrying with fallback template language: ${WHATSAPP_TEMPLATE_LANGUAGE_FALLBACK}`
      );
      const fallbackAttempt = await postWhatsAppTemplateMessage(
        formattedPhone,
        templateName,
        templateParams,
        WHATSAPP_TEMPLATE_LANGUAGE_FALLBACK
      );
      if (fallbackAttempt.success) return true;
    }

    // Retry without params only when API clearly says the template expects zero params.
    if (templateParams.length > 0) {
      const expectedParams = getExpectedTemplateParamCount(firstAttempt.error);
      if (expectedParams === 0) {
        console.log("[WhatsApp] Retrying template send without parameters...");
        const noParamAttempt = await postWhatsAppTemplateMessage(
          formattedPhone,
          templateName,
          [],
          WHATSAPP_TEMPLATE_LANGUAGE
        );
        if (noParamAttempt.success) return true;

        if (
          noParamAttempt.error?.error?.code === 132001 &&
          WHATSAPP_TEMPLATE_LANGUAGE_FALLBACK
        ) {
          console.log(
            `[WhatsApp] Retrying no-param send with fallback language: ${WHATSAPP_TEMPLATE_LANGUAGE_FALLBACK}`
          );
          const noParamFallbackAttempt = await postWhatsAppTemplateMessage(
            formattedPhone,
            templateName,
            [],
            WHATSAPP_TEMPLATE_LANGUAGE_FALLBACK
          );
          return noParamFallbackAttempt.success;
        }
      }

      return false;
    }

    return false;
  } catch (error) {
    console.error(`[WhatsApp] Failed to send message to ${phoneNumber}:`, error);
    return false;
  }
}

export async function sendWhatsAppCustomTextMessage(
  phoneNumber: string,
  customMessage: string
): Promise<boolean> {
  if (!WHATSAPP_PHONE_NUMBER_ID || !WHATSAPP_ACCESS_TOKEN) {
    console.warn("WhatsApp credentials not configured");
    return false;
  }

  try {
    const formattedPhone = normalizePhoneNumber(phoneNumber);
    if (!formattedPhone || !isProbablyValidPhoneNumber(formattedPhone)) {
      console.warn(`[WhatsApp] Skipping invalid recipient phone number: ${phoneNumber}`);
      return false;
    }

    if (!customMessage || !customMessage.trim()) {
      console.warn(`[WhatsApp] Custom message is empty for ${phoneNumber}`);
      return false;
    }

    console.log(`[WhatsApp] Sending custom text message to ${phoneNumber} (formatted: ${formattedPhone})...`);
    const result = await postWhatsAppCustomMessage(formattedPhone, customMessage);
    return result.success;
  } catch (error) {
    console.error(`[WhatsApp] Failed to send custom message to ${phoneNumber}:`, error);
    return false;
  }
}

export async function notifyProjectCreated(
  projectName: string,
  clientPhoneNumbers: string[],
  teamPhoneNumbers: string[],
  projectLink: string
): Promise<void> {
  const allPhoneNumbers = await buildRecipientList(clientPhoneNumbers, teamPhoneNumbers);

  // Build custom message if enabled
  let customMessage: string | undefined;
  if (WHATSAPP_USE_CUSTOM_MESSAGES) {
    customMessage = `🎉 *New Project Created*\n\n*Project:* ${projectName}\n\n*View Project:* ${projectLink}\n\nPlease click the link above to view project details.`;
  }

  // Send messages asynchronously without blocking the response
  Promise.all(
    allPhoneNumbers.map((phone) =>
      sendWhatsAppMessage(phone, customMessage || "", {
        templateName: WHATSAPP_TEMPLATE_GREETING,
        templateParams: [projectLink],
      })
    )
  ).catch((error) => {
    console.error("Error sending WhatsApp notifications:", error);
  });
}

export async function notifyClientsAdded(
  projectName: string,
  clientNames: string[],
  clientPhoneNumbers: string[],
  teamPhoneNumbers: string[]
): Promise<void> {
  const allPhoneNumbers = await buildRecipientList(clientPhoneNumbers, teamPhoneNumbers);

  const clientLabel = clientNames.length === 1 ? clientNames[0] : clientNames.join(", ");

  let customMessage: string | undefined;
  if (WHATSAPP_USE_CUSTOM_MESSAGES) {
    customMessage = `👋 *New Client Added*\n\n*Project:* ${projectName}\n*Client:* ${clientLabel}\n\nThe project now includes updated client details.`;
  }

  const templateParams = [`Project: ${projectName}\nNew Client(s): ${clientLabel}`];

  Promise.all(
    allPhoneNumbers.map((phone) =>
      sendWhatsAppMessage(phone, customMessage || "", {
        templateName: WHATSAPP_TEMPLATE_NOTIFICATION,
        templateParams,
      })
    )
  ).catch((error) => {
    console.error("Error sending WhatsApp new client notifications:", error);
  });
}

export async function notifyProjectUpdate(
  projectName: string,
  updateType: "file_uploaded" | "meeting_minutes" | "other",
  clientPhoneNumbers: string[],
  teamPhoneNumbers: string[],
  details?: string
): Promise<void> {
  let templateName = WHATSAPP_TEMPLATE_NOTIFICATION;
  let templateParams: string[] = [`Project: ${projectName}`];
  let customMessage: string | undefined;

  if (WHATSAPP_USE_CUSTOM_MESSAGES) {
    switch (updateType) {
      case "file_uploaded":
        customMessage = `📁 *File Uploaded*\n\n*Project:* ${projectName}\n${details ? `*File:* ${details}\n` : ""}✅ A new file has been uploaded to your project.`;
        break;
      case "meeting_minutes":
        customMessage = `📝 *Meeting Minutes Published*\n\n*Project:* ${projectName}\n${details ? `*Details:* ${details}\n` : ""}Please review the meeting minutes for updates.`;
        break;
      default:
        customMessage = `🔔 *Project Update*\n\n*Project:* ${projectName}\n${details ? `*Update:* ${details}\n` : ""}There's been an update on your project.`;
    }
  } else {
    switch (updateType) {
      case "file_uploaded":
        templateName = WHATSAPP_TEMPLATE_NOTIFICATION;
        templateParams = [
          details
            ? `Project: ${projectName}\nFile Name: ${details}`
            : `Project: ${projectName}\nA new file has been uploaded.`,
        ];
        break;
      case "meeting_minutes":
        templateName = WHATSAPP_TEMPLATE_NOTIFICATION;
        templateParams = [
          details
            ? `Project: ${projectName}\nMeeting Minutes: ${details}`
            : `Project: ${projectName}\nMeeting minutes were published.`,
        ];
        break;
      default:
        templateName = WHATSAPP_TEMPLATE_NOTIFICATION;
        templateParams = [
          details
            ? `Project: ${projectName}\nUpdate: ${details}`
            : `Project: ${projectName}\nThere has been an update.`,
        ];
    }
  }

  const allPhoneNumbers = await buildRecipientList(clientPhoneNumbers, teamPhoneNumbers);

  // Send messages asynchronously without blocking the response
  Promise.all(
    allPhoneNumbers.map((phone) =>
      sendWhatsAppMessage(phone, customMessage || "", {
        templateName,
        templateParams,
      })
    )
  ).catch((error) => {
    console.error("Error sending WhatsApp notifications:", error);
  });
}

export async function notifyTaskCreated(
  taskTitle: string,
  projectName: string,
  clientPhoneNumbers: string[],
  teamPhoneNumbers: string[],
  dueDate?: string
): Promise<void> {
  const allPhoneNumbers = await buildRecipientList(clientPhoneNumbers, teamPhoneNumbers);

  let customMessage: string | undefined;
  if (WHATSAPP_USE_CUSTOM_MESSAGES) {
    customMessage = `📋 *New Task Created*\n\n*Task:* ${taskTitle}\n*Project:* ${projectName}\n*Due Date:* ${dueDate || "N/A"}\n\nPlease review and update your progress.`;
  }

  const templateParams = [
    `Project: ${projectName}\nTask Created: ${taskTitle}\nDue Date: ${dueDate || "N/A"}`,
  ];

  // Send messages asynchronously without blocking the response
  Promise.all(
    allPhoneNumbers.map((phone) =>
      sendWhatsAppMessage(phone, customMessage || "", {
        templateName: WHATSAPP_TEMPLATE_NOTIFICATION,
        templateParams,
      })
    )
  ).catch((error) => {
    console.error("Error sending task creation WhatsApp notifications:", error);
  });
}

export async function notifyTaskStatusChanged(
  taskTitle: string,
  projectName: string,
  newStatus: string,
  clientPhoneNumbers: string[],
  teamPhoneNumbers: string[]
): Promise<void> {
  const allPhoneNumbers = await buildRecipientList(clientPhoneNumbers, teamPhoneNumbers);

  let customMessage: string | undefined;
  if (WHATSAPP_USE_CUSTOM_MESSAGES) {
    customMessage = `✅ *Task Status Updated*\n\n*Task:* ${taskTitle}\n*Project:* ${projectName}\n*New Status:* ${newStatus.toUpperCase()}\n\nKeep up the good work!`;
  }

  const templateParams = [
    `Project: ${projectName}\nTask Updated: ${taskTitle}\nNew Status: ${newStatus}`,
  ];

  // Send messages asynchronously without blocking the response
  Promise.all(
    allPhoneNumbers.map((phone) =>
      sendWhatsAppMessage(phone, customMessage || "", {
        templateName: WHATSAPP_TEMPLATE_NOTIFICATION,
        templateParams,
      })
    )
  ).catch((error) => {
    console.error("Error sending task status update WhatsApp notifications:", error);
  });
}

export async function notifyProjectStatusChanged(
  projectName: string,
  newStatus: string,
  clientPhoneNumbers: string[],
  teamPhoneNumbers: string[]
): Promise<void> {
  const allPhoneNumbers = await buildRecipientList(clientPhoneNumbers, teamPhoneNumbers);

  let customMessage: string | undefined;
  if (WHATSAPP_USE_CUSTOM_MESSAGES) {
    customMessage = `🚀 *Project Status Changed*\n\n*Project:* ${projectName}\n*New Status:* ${newStatus.toUpperCase()}\n\nMessage from your CBC Dashboard team.`;
  }

  const templateParams = [`Project: ${projectName}\nNew Project Status: ${newStatus}`];

  // Send messages asynchronously without blocking the response
  Promise.all(
    allPhoneNumbers.map((phone) =>
      sendWhatsAppMessage(phone, customMessage || "", {
        templateName: WHATSAPP_TEMPLATE_NOTIFICATION,
        templateParams,
      })
    )
  ).catch((error) => {
    console.error("Error sending project status change WhatsApp notifications:", error);
  });
}

export async function notifyTeamMemberAdded(
  projectName: string,
  memberName: string,
  clientPhoneNumbers: string[],
  teamPhoneNumbers: string[]
): Promise<void> {
  const allPhoneNumbers = [...new Set([...clientPhoneNumbers, ...teamPhoneNumbers])].filter(
    (phone) => typeof phone === "string" && phone.trim().length > 0
  );

  let customMessage: string | undefined;
  if (WHATSAPP_USE_CUSTOM_MESSAGES) {
    customMessage = `👥 *Team Member Added*\n\n*Project:* ${projectName}\n*New Member:* ${memberName}\n\nWelcome to the team! Please view project details for updates.`;
  }

  const templateParams = [`Project: ${projectName}\nTeam Member Added: ${memberName}`];

  // Send messages asynchronously without blocking the response
  Promise.all(
    allPhoneNumbers.map((phone) =>
      sendWhatsAppMessage(phone, customMessage || "", {
        templateName: WHATSAPP_TEMPLATE_NOTIFICATION,
        templateParams,
      })
    )
  ).catch((error) => {
    console.error("Error sending team member added WhatsApp notifications:", error);
  });
}

export async function notifyProjectTimelineChanged(
  projectName: string,
  changeDetails: string,
  clientPhoneNumbers: string[],
  teamPhoneNumbers: string[]
): Promise<void> {
  const allPhoneNumbers = [...new Set([...clientPhoneNumbers, ...teamPhoneNumbers])].filter(
    (phone) => typeof phone === "string" && phone.trim().length > 0
  );

  let customMessage: string | undefined;
  if (WHATSAPP_USE_CUSTOM_MESSAGES) {
    customMessage = `📅 *Project Timeline Updated*\n\n*Project:* ${projectName}\n*Changes:* ${changeDetails}\n\nPlease review and adjust your schedules accordingly.`;
  }

  const templateParams = [`Project: ${projectName}\nTimeline Update: ${changeDetails}`];

  // Send messages asynchronously without blocking the response
  Promise.all(
    allPhoneNumbers.map((phone) =>
      sendWhatsAppMessage(phone, customMessage || "", {
        templateName: WHATSAPP_TEMPLATE_NOTIFICATION,
        templateParams,
      })
    )
  ).catch((error) => {
    console.error("Error sending project timeline update WhatsApp notifications:", error);
  });
}
