/**
 * Utility functions for converting MUI charts to images for PDF generation
 */

/**
 * Converts a DOM element (chart) to a base64 image string
 * @param element - The DOM element containing the chart
 * @param width - Desired width of the image
 * @param height - Desired height of the image
 * @returns Promise resolving to base64 image string
 */
export const elementToImage = async (
  element: HTMLElement,
  width: number = 500,
  height: number = 300,
): Promise<string> => {
  console.log('Converting element to image...', { width, height })

  return new Promise((resolve, reject) => {
    try {
      // Create a canvas element
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        reject(new Error('Could not get canvas context'))
        return
      }

      // Set canvas dimensions
      canvas.width = width
      canvas.height = height

      // Get the SVG element from the chart
      const svgElement = element.querySelector('svg')
      if (!svgElement) {
        console.error('No SVG element found in chart element')
        reject(new Error('No SVG element found in chart'))
        return
      }

      console.log('SVG element found:', {
        width: svgElement.getAttribute('width'),
        height: svgElement.getAttribute('height'),
        viewBox: svgElement.getAttribute('viewBox'),
      })

      // Convert SVG to string
      const svgData = new XMLSerializer().serializeToString(svgElement)
      console.log('SVG data length:', svgData.length)

      // Create data URL instead of blob URL to avoid CSP issues
      const svgDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgData)}`

      // Create an image and draw it on canvas
      const img = new Image()
      img.onload = () => {
        console.log('SVG image loaded successfully')

        // Fill white background
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, width, height)

        // Draw the SVG image
        ctx.drawImage(img, 0, 0, width, height)

        // Convert canvas to base64
        const base64 = canvas.toDataURL('image/png')
        console.log('Canvas converted to base64:', {
          length: base64.length,
          prefix: base64.substring(0, 50),
        })

        resolve(base64)
      }

      img.onerror = (error) => {
        console.error('Error loading SVG image:', error)
        reject(new Error('Failed to load SVG image'))
      }

      img.src = svgDataUrl
    } catch (error) {
      console.error('Error in elementToImage:', error)
      reject(error)
    }
  })
}

/**
 * Captures a chart element and converts it to base64 image
 * @param chartRef - React ref to the chart element
 * @param width - Desired width of the image
 * @param height - Desired height of the image
 * @returns Promise resolving to base64 image string
 */
export const captureChartAsImage = async (
  chartRef: React.RefObject<HTMLDivElement | null>,
  width: number = 500,
  height: number = 300,
): Promise<string | null> => {
  console.log('Capturing chart image...', {
    refExists: !!chartRef.current,
    width,
    height,
  })

  if (!chartRef.current) {
    console.warn('Chart ref is not available')
    return null
  }

  console.log('Chart element found:', {
    tagName: chartRef.current.tagName,
    childElementCount: chartRef.current.childElementCount,
    innerHTML: chartRef.current.innerHTML.substring(0, 100) + '...',
  })

  try {
    const result = await elementToImage(chartRef.current, width, height)
    console.log('Chart image captured successfully:', {
      imageLength: result?.length,
      imagePrefix: result?.substring(0, 50),
    })
    return result
  } catch (error) {
    console.error('Error capturing chart as image:', error)
    return null
  }
}
