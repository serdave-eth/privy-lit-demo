export const getPermissionedFileMetadata = async (
  dataIdentifier: string,
  apiUrl: string
) => {
  console.log("[DEBUG] getPermissionedFileMetadata called with:", {
    dataIdentifier,
    apiUrl
  });

  try {
    const url = `${apiUrl}/graph/fileMetadata?fileIdentifier=${dataIdentifier}`;
    console.log("[DEBUG] Calling API at:", url);
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    console.log("[DEBUG] Got metadata from API:", data);
    
    if (!data.fileMetadata) {
      throw new Error(`No file metadata found for identifier: ${dataIdentifier}`);
    }

    return data.fileMetadata.fileMetadata;
  } catch (error: any) {
    console.error("[ERROR] API request error:", error);
    throw new Error(`Failed to fetch file metadata: ${error?.message || 'Unknown error'}`);
  }
};