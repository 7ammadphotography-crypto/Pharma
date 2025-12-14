import { base44 } from './base44Client';




// Lazy access wrappers to prevent undefined errors during module initialization
export const Core = {
    InvokeLLM: (...args) => base44.integrations.Core.InvokeLLM(...args),
    SendEmail: (...args) => base44.integrations.Core.SendEmail(...args),
    UploadFile: (...args) => base44.integrations.Core.UploadFile(...args),
    GenerateImage: (...args) => base44.integrations.Core.GenerateImage(...args),
    ExtractDataFromUploadedFile: (...args) => base44.integrations.Core.ExtractDataFromUploadedFile(...args),
    CreateFileSignedUrl: (...args) => base44.integrations.Core.CreateFileSignedUrl(...args),
    UploadPrivateFile: (...args) => base44.integrations.Core.UploadPrivateFile(...args),
};

export const InvokeLLM = (...args) => base44.integrations.Core.InvokeLLM(...args);

export const SendEmail = (...args) => base44.integrations.Core.SendEmail(...args);

export const UploadFile = (...args) => base44.integrations.Core.UploadFile(...args);

export const GenerateImage = (...args) => base44.integrations.Core.GenerateImage(...args);

export const ExtractDataFromUploadedFile = (...args) => base44.integrations.Core.ExtractDataFromUploadedFile(...args);

export const CreateFileSignedUrl = (...args) => base44.integrations.Core.CreateFileSignedUrl(...args);

export const UploadPrivateFile = (...args) => base44.integrations.Core.UploadPrivateFile(...args);



