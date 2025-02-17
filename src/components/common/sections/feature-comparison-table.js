'use client';

import React from 'react';
import themeConfig from '../../../styles/themeConfig';

// 特性可用性状态组件
const FeatureAvailability = ({ value }) => {
  if (typeof value === 'boolean') {
    return (
      <div className="flex justify-center">
        {value ? (
          <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-50">
            <i className="fas fa-check text-[#4B89FF]" />
          </div>
        ) : (
          <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-50">
            <i className="fas fa-minus text-gray-300" />
          </div>
        )}
      </div>
    );
  }
  return (
    <div className="flex justify-center">
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  );
};

function FeatureComparisonTable({ data, theme = 'normal' }) {
  const { title, subTitle, bottomContent } = data || {};
  const styles = themeConfig[theme];

  return (
    <div className="w-full py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4">
        {/* 标题部分 */}
        <div className="text-center mb-6">
          <h2 className={`${styles.typography.h2.fontSize} ${styles.typography.h2.fontWeight} ${styles.typography.h2.color} mb-3`}>
            {title}
          </h2>
          <p className={`${styles.typography.paragraph.fontSize} ${styles.typography.paragraph.color}`}>
            {subTitle}
          </p>
        </div>

        {/* 对比表格 */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-lg">
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left py-4 px-6 bg-gray-50 w-1/3">Features</th>
                {bottomContent?.columns?.map((column, index) => (
                  <th key={index} className="py-4 px-6 bg-gray-50">
                    <div className="text-base font-semibold mb-1">{column.title}</div>
                    <div className="text-xs text-gray-500">{column.subtitle}</div>
                    {column.recommended && (
                      <div className="inline-block mt-1 text-[10px] text-[#4B89FF] bg-blue-50 px-2 py-0.5 rounded-full">
                        Recommended
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bottomContent?.featureGroups?.map((group, groupIndex) => (
                <React.Fragment key={groupIndex}>
                  {/* 分类标题 */}
                  <tr>
                    <td 
                      colSpan={bottomContent.columns.length + 1}
                      className="text-left py-4 px-6 bg-[#F8FAFC] font-semibold text-gray-900 text-sm border-t border-b border-gray-100"
                    >
                      {group.name}
                    </td>
                  </tr>
                  {/* 特性行 */}
                  {group.features.map((feature, featureIndex) => (
                    <tr key={featureIndex} className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200">
                      <td className="text-left py-4 px-6 text-gray-600 text-xs">
                        {feature.name}
                      </td>
                      {feature.values.map((value, valueIndex) => (
                        <td 
                          key={valueIndex}
                          className={`py-4 px-6 ${bottomContent.columns[valueIndex].recommended ? 'bg-blue-50/10' : ''}`}
                        >
                          <FeatureAvailability value={value} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default FeatureComparisonTable;
