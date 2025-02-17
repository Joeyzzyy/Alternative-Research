export async function validateDomain(domain) {
  try {
    // 基本格式验证
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-_.]*\.[a-zA-Z]{2,}$/
    if (!domainRegex.test(domain)) {
      return false
    }

    // 检查域名是否已存在
    const existing = await prisma.domainMappings.findFirst({
      where: { full_domain: domain }
    })
    
    if (existing) {
      return false
    }

    // 可以添加更多验证逻辑
    // 例如：DNS 记录验证
    // const dnsValid = await checkDNSRecord(domain)
    
    return true
  } catch (error) {
    console.error('Domain validation error:', error)
    return false
  }
} 