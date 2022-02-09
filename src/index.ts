import os from 'os'
import path from 'path'
import fs from 'fs'
import ffi from 'ffi-napi'

const LIBNAME = 'libindy'
const ENV_VAR = 'LIB_INDY_VDR_PATH'

const extensions: Record<string, string> = { darwin: '.dylib', linux: '.so', win32: '.dll' }
const libPaths: Record<string, Array<string>> = {
  darwin: ['/usr/local/lib/', '/usr/lib/', '/opt/homebrew/opt/'],
  linux: ['/usr/lib/', '/usr/local/lib/'],
  win32: ['c:\\windows\\system32\\'],
}

// Alias for a simple function to check if the path exists
const doesPathExist = fs.existsSync

const getLibrary = () => {
  // Detect OS; darwin, linux and windows are only supported
  const platform = os.platform()

  // Get a potential path from the environment variable
  const pathFromEnvironment = process.env[ENV_VAR]

  // Get the paths specific to the users operating system
  const platformPaths = libPaths[platform]

  // Check if the path from the environment variable is supplied and add it
  // We use unshift here so that when we want to get a valid library path this will be the first to resolve
  if (pathFromEnvironment) platformPaths.unshift(pathFromEnvironment)

  // Create the path + file
  const libraries = platformPaths.map((p) => path.join(p, `${LIBNAME}${extensions[platform]}`))

  // Gaurd so we quit if there is no valid path for the library
  if (!libraries.some(doesPathExist)) throw new Error(`Could not find ${LIBNAME} with these paths: ${libraries}`)

  // Get the first valid library
  // Casting here as a string because there is a guard of none of the paths
  // would be valid
  const validLibraryPath = libraries.find((l) => doesPathExist(l)) as string

  return ffi.Library(validLibraryPath, { indy_set_logger: ['void', []] })
}

const lib = getLibrary()

lib.indy_set_logger()
