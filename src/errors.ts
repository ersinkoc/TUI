/**
 * @oxog/tui - Error Classes
 * @packageDocumentation
 */

/**
 * Error codes for TUI errors.
 */
export type TUIErrorCode =
  | 'PLUGIN_ERROR'
  | 'PLUGIN_NOT_FOUND'
  | 'PLUGIN_DEPENDENCY'
  | 'LAYOUT_ERROR'
  | 'LAYOUT_OVERFLOW'
  | 'RENDER_ERROR'
  | 'VALIDATION_ERROR'
  | 'STREAM_ERROR'
  | 'INVALID_NODE'
  | 'INVALID_OPTION'
  | 'INVALID_COLOR'
  | 'NOT_RUNNING'
  | 'ALREADY_RUNNING'
  | 'BUFFER_INVALID_SIZE'
  | 'NODE_DISPOSED'
  | 'NODE_MAX_CHILDREN'

/**
 * Base TUI error class.
 *
 * @example
 * ```typescript
 * throw new TUIError('Something went wrong', 'RENDER_ERROR')
 * ```
 */
export class TUIError extends Error {
  /**
   * Create a TUI error.
   * @param message - Error message
   * @param code - Error code
   */
  constructor(
    message: string,
    public readonly code: TUIErrorCode
  ) {
    super(message)
    this.name = 'TUIError'
    // Maintains proper stack trace for where error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, TUIError)
    }
  }
}

/**
 * Plugin-related error.
 *
 * @example
 * ```typescript
 * throw new PluginError('Plugin initialization failed', 'my-plugin')
 * ```
 */
export class PluginError extends TUIError {
  /**
   * Create a plugin error.
   * @param message - Error message
   * @param pluginName - Name of the plugin that caused the error
   */
  constructor(
    message: string,
    public readonly pluginName: string
  ) {
    super(`[${pluginName}] ${message}`, 'PLUGIN_ERROR')
    this.name = 'PluginError'
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, PluginError)
    }
  }
}

/**
 * Layout calculation error.
 *
 * @example
 * ```typescript
 * throw new LayoutError('Circular dependency detected')
 * ```
 */
export class LayoutError extends TUIError {
  /**
   * Create a layout error.
   * @param message - Error message
   */
  constructor(message: string) {
    super(message, 'LAYOUT_ERROR')
    this.name = 'LayoutError'
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, LayoutError)
    }
  }
}

/**
 * Rendering error.
 *
 * @example
 * ```typescript
 * throw new RenderError('Buffer overflow')
 * ```
 */
export class RenderError extends TUIError {
  /**
   * Create a render error.
   * @param message - Error message
   */
  constructor(message: string) {
    super(message, 'RENDER_ERROR')
    this.name = 'RenderError'
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, RenderError)
    }
  }
}

/**
 * Validation error for invalid inputs.
 *
 * @example
 * ```typescript
 * throw new ValidationError('Invalid color value')
 * ```
 */
export class ValidationError extends TUIError {
  /**
   * Create a validation error.
   * @param message - Error message
   */
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR')
    this.name = 'ValidationError'
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ValidationError)
    }
  }
}

/**
 * Stream error for stdin/stdout issues.
 *
 * @example
 * ```typescript
 * throw new StreamError('stdout is not a TTY')
 * ```
 */
export class StreamError extends TUIError {
  /**
   * Create a stream error.
   * @param message - Error message
   */
  constructor(message: string) {
    super(message, 'STREAM_ERROR')
    this.name = 'StreamError'
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, StreamError)
    }
  }
}

/**
 * Check if an error is a TUI error.
 * @param error - Error to check
 * @returns True if error is a TUIError
 */
export function isTUIError(error: unknown): error is TUIError {
  return error instanceof TUIError
}

/**
 * Check if an error is a plugin error.
 * @param error - Error to check
 * @returns True if error is a PluginError
 */
export function isPluginError(error: unknown): error is PluginError {
  return error instanceof PluginError
}

/**
 * Create an error with a specific code.
 * @param code - Error code
 * @param message - Error message
 * @returns TUIError instance
 */
export function createError(code: TUIErrorCode, message: string): TUIError {
  switch (code) {
    case 'PLUGIN_ERROR':
    case 'PLUGIN_NOT_FOUND':
    case 'PLUGIN_DEPENDENCY':
      return new TUIError(message, code)
    case 'LAYOUT_ERROR':
    case 'LAYOUT_OVERFLOW':
      return new LayoutError(message)
    case 'RENDER_ERROR':
      return new RenderError(message)
    case 'VALIDATION_ERROR':
    case 'INVALID_COLOR':
    case 'INVALID_OPTION':
    case 'INVALID_NODE':
      return new ValidationError(message)
    case 'STREAM_ERROR':
      return new StreamError(message)
    case 'BUFFER_INVALID_SIZE':
      return new BufferSizeError(0, 0)
    case 'NODE_DISPOSED':
      return new DisposedNodeError('', '')
    case 'NODE_MAX_CHILDREN':
      return new NodeMaxChildrenError('')
    default:
      return new TUIError(message, code)
  }
}

/**
 * Buffer size error.
 *
 * Thrown when attempting to create a buffer with invalid dimensions.
 *
 * @example
 * ```typescript
 * throw new BufferSizeError(-1, 100)  // Invalid width
 * ```
 */
export class BufferSizeError extends TUIError {
  /**
   * Create a buffer size error.
   * @param width - Invalid width
   * @param height - Invalid height
   */
  constructor(
    public readonly width: number,
    public readonly height: number
  ) {
    super(
      `Invalid buffer size: ${width}x${height}. ` +
      `Width and height must be positive numbers, and size must not exceed 1,000,000 cells.`,
      'BUFFER_INVALID_SIZE'
    )
    this.name = 'BufferSizeError'
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, BufferSizeError)
    }
  }
}

/**
 * Disposed node error.
 *
 * Thrown when attempting to operate on a node that has been disposed.
 *
 * @example
 * ```typescript
 * throw new DisposedNodeError('node_123', 'addChild')
 * ```
 */
export class DisposedNodeError extends TUIError {
  /**
   * Create a disposed node error.
   * @param nodeId - ID of the disposed node
   * @param operation - Operation that was attempted
   */
  constructor(
    public readonly nodeId: string,
    public readonly operation: string
  ) {
    super(
      `Cannot ${operation} on disposed node "${nodeId}". ` +
      `The node has been disposed and can no longer be used.`,
      'NODE_DISPOSED'
    )
    this.name = 'DisposedNodeError'
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DisposedNodeError)
    }
  }
}

/**
 * Maximum children exceeded error.
 *
 * Thrown when attempting to add more children than allowed to a container.
 *
 * @example
 * ```typescript
 * throw new NodeMaxChildrenError('node_456')
 * ```
 */
export class NodeMaxChildrenError extends TUIError {
  /**
   * Create a max children error.
   * @param parentId - ID of the parent node
   */
  constructor(
    public readonly parentId: string
  ) {
    super(
      `Maximum children limit reached for node "${parentId}". ` +
      `Cannot add more children. Consider using virtual scrolling for large lists.`,
      'NODE_MAX_CHILDREN'
    )
    this.name = 'NodeMaxChildrenError'
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, NodeMaxChildrenError)
    }
  }
}
