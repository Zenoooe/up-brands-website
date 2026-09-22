import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Trash2, Save, Tags, Wand2, ChevronDown, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { Project } from '../../types';

export interface ServiceItem {
  en: string;
  zh: string;
  showInFilter?: boolean;
}

export interface ServiceCategory {
  title_en: string;
  title_zh: string;
  items: ServiceItem[];
}

export interface IndustryItem {
  en: string;
  zh: string;
  showInFilter?: boolean;
}

export function TagsManager() {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [industries, setIndustries] = useState<IndustryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [autoTagging, setAutoTagging] = useState(false);
  
  const [isServicesExpanded, setIsServicesExpanded] = useState(false);
  const [isIndustriesExpanded, setIsIndustriesExpanded] = useState(false);

  useEffect(() => {
    loadHierarchy().catch(err => {
      console.error('Failed to load hierarchy in useEffect:', err);
      setLoading(false);
    });
  }, []);

  const loadHierarchy = async () => {
    try {
      const [servicesRes, industriesRes] = await Promise.all([
        supabase.from('settings').select('*').eq('key', 'services_hierarchy').maybeSingle(),
        supabase.from('settings').select('*').eq('key', 'industries_list').maybeSingle()
      ]);
      
      if (servicesRes.data && servicesRes.data.value) {
        setCategories(servicesRes.data.value);
      } else {
        setCategories([
          {
            title_en: "Brand Strategy",
            title_zh: "品牌策略",
            items: [
              { en: "Research & Insights", zh: "研究与洞察" },
              { en: "La Collab, task force dedicated to GenZ insights and trends", zh: "Z世代趋势与洞察团队" },
              { en: "Innovation", zh: "创新策略" },
              { en: "Business Design", zh: "商业设计" },
              { en: "Strategic Positioning", zh: "战略定位" },
              { en: "Brand Purpose & Brand Platform", zh: "品牌愿景与品牌平台" },
              { en: "Brand Architecture", zh: "品牌架构" },
              { en: "Messaging", zh: "信息传达" },
              { en: "Brand Management", zh: "品牌管理" }
            ]
          },
          {
            title_en: "Brand Expression",
            title_zh: "品牌表达",
            items: [
              { en: "Visual identity", zh: "视觉识别" },
              { en: "Brand Territory", zh: "品牌领域" },
              { en: "Naming", zh: "命名" },
              { en: "Verbal Identity", zh: "语词识别" },
              { en: "Packaging", zh: "包装设计" },
              { en: "UI / UX", zh: "UI / UX" }
            ]
          },
          {
            title_en: "Brand Experience",
            title_zh: "品牌体验",
            items: [
              { en: "Customer Journey", zh: "客户旅程" },
              { en: "Architecture (Retail, Hospitality, Workspace Design)", zh: "空间建筑（零售、酒店、办公设计）" },
              { en: "Signage & Environmental Design", zh: "导视与环境设计" },
              { en: "Merchandising", zh: "商品陈列" },
              { en: "Activation & Launch", zh: "活动与发布" },
              { en: "Digital Ecosystem", zh: "数字生态系统" }
            ]
          },
          {
            title_en: "Brand Content",
            title_zh: "品牌内容",
            items: [
              { en: "Corporate Communication, B2B / B2C", zh: "企业传播 (B2B / B2C)" },
              { en: "Institutional Publishing, Annual & CSR Reporting", zh: "机构出版物、年度与CSR报告" },
              { en: "Employer Branding & Communication", zh: "雇主品牌与传播" },
              { en: "Social Media & Content", zh: "社交媒体与内容" },
              { en: "Activation", zh: "活动激活" },
              { en: "Video Production", zh: "视频制作" }
            ]
          }
        ]);
      }

      if (industriesRes.data && industriesRes.data.value) {
        let saved = industriesRes.data.value;
        // Auto-upgrade to the 13 comprehensive tags if they only have the old basic ones
        if (saved.length <= 4) {
          saved = [
            { en: "FMCG", zh: "快消品", showInFilter: true },
            { en: "Beauty & Cosmetics", zh: "美妆个护", showInFilter: true },
            { en: "Tech & Electronics", zh: "科技与电子", showInFilter: true },
            { en: "Lifestyle & Leisure", zh: "生活方式", showInFilter: true },
            { en: "Healthcare & Pharma", zh: "医疗与大健康", showInFilter: true },
            { en: "Food & Beverage", zh: "食品餐饮", showInFilter: true },
            { en: "Hospitality & Travel", zh: "酒店与文旅", showInFilter: true },
            { en: "Automotive & Mobility", zh: "汽车与出行", showInFilter: true },
            { en: "Real Estate & Architecture", zh: "地产与建筑", showInFilter: true },
            { en: "Finance & Fintech", zh: "金融与金融科技", showInFilter: true },
            { en: "Fashion & Apparel", zh: "时尚与服饰", showInFilter: true },
            { en: "Retail & E-commerce", zh: "零售与电商", showInFilter: true },
            { en: "Culture & Arts", zh: "文化与艺术", showInFilter: true }
          ];
        }
        setIndustries(saved);
      } else {
        setIndustries([
          { en: "FMCG", zh: "快消品" },
          { en: "Beauty & Cosmetics", zh: "美妆个护" },
          { en: "Tech & Electronics", zh: "科技与电子" },
          { en: "Lifestyle & Leisure", zh: "生活方式" },
          { en: "Healthcare & Pharma", zh: "医疗与大健康" },
          { en: "Food & Beverage", zh: "食品餐饮" },
          { en: "Hospitality & Travel", zh: "酒店与文旅" },
          { en: "Automotive & Mobility", zh: "汽车与出行" },
          { en: "Real Estate & Architecture", zh: "地产与建筑" },
          { en: "Finance & Fintech", zh: "金融与金融科技" },
          { en: "Fashion & Apparel", zh: "时尚与服饰" },
          { en: "Retail & E-commerce", zh: "零售与电商" },
          { en: "Culture & Arts", zh: "文化与艺术" }
        ]);
      }
    } catch (error) {
      console.error('Error loading tags hierarchy:', error);
      toast.error('Failed to load tags hierarchy');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save Services
      const { data: existingServices } = await supabase.from('settings').select('key').eq('key', 'services_hierarchy').maybeSingle();
      if (existingServices) {
        const { error } = await supabase.from('settings').update({ value: categories }).eq('key', 'services_hierarchy');
        if (error) throw error;
      } else {
        const { error } = await supabase.from('settings').insert({ key: 'services_hierarchy', value: categories });
        if (error) throw error;
      }

      // Save Industries
      const { data: existingIndustries } = await supabase.from('settings').select('key').eq('key', 'industries_list').maybeSingle();
      if (existingIndustries) {
        const { error } = await supabase.from('settings').update({ value: industries }).eq('key', 'industries_list');
        if (error) throw error;
      } else {
        const { error } = await supabase.from('settings').insert({ key: 'industries_list', value: industries });
        if (error) throw error;
      }

      toast.success('Tags & Industries saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleAutoTag = async () => {
    if (!confirm('Are you sure you want to auto-tag untagged projects? (Projects with existing valid tags will be skipped)')) return;
    
    setAutoTagging(true);
    try {
      const { data: projects, error: fetchErr } = await supabase.from('projects').select('*');
      if (fetchErr) throw fetchErr;

      let updatedCount = 0;
      let skippedCount = 0;

      for (const project of (projects as Project[])) {
        // Skip projects that are already tagged in the new JSON format
        let isAlreadyTagged = false;
        try {
          if (project.category && project.category.startsWith('{')) {
            const parsed = JSON.parse(project.category);
            if ((Array.isArray(parsed.services) && parsed.services.length > 0) || 
                (Array.isArray(parsed.industries) && parsed.industries.length > 0)) {
              isAlreadyTagged = true;
            }
          }
        } catch (e) {
          // not valid JSON, needs tagging
        }

        if (isAlreadyTagged) {
          skippedCount++;
          continue;
        }

        const text = `${project.title || ''} ${project.subtitle || ''} ${project.description_en || ''} ${project.category || ''}`.toLowerCase();
        
        const matchedServices = new Set<string>();
        const matchedIndustries = new Set<string>();

        // Heuristics for Services
        if (text.includes('brand') || text.includes('identity')) matchedServices.add('Visual identity');
        if (text.includes('strategy') || text.includes('positioning')) matchedServices.add('Strategic Positioning');
        if (text.includes('packaging')) matchedServices.add('Packaging');
        if (text.includes('web') || text.includes('digital') || text.includes('ui') || text.includes('ux')) matchedServices.add('UI / UX');
        if (text.includes('name') || text.includes('naming')) matchedServices.add('Naming');
        if (text.includes('research') || text.includes('insight')) matchedServices.add('Research & Insights');
        if (text.includes('video') || text.includes('motion')) matchedServices.add('Video Production');
        if (text.includes('social') || text.includes('media')) matchedServices.add('Social Media & Content');
        if (text.includes('retail') || text.includes('architecture') || text.includes('space') || text.includes('interior')) matchedServices.add('Architecture (Retail, Hospitality, Workspace Design)');

        // Heuristics for Industries
        if (text.match(/fmcg|fast moving|consumer goods|beverage|drink|food|snack/)) matchedIndustries.add('FMCG');
        if (text.match(/food|beverage|restaurant|cafe|coffee/)) matchedIndustries.add('Food & Beverage');
        if (text.match(/beauty|cosmetic|skincare|makeup|fragrance|perfume/)) matchedIndustries.add('Beauty & Cosmetics');
        if (text.match(/tech|electronic|software|app|device|ai/)) matchedIndustries.add('Tech & Electronics');
        if (text.match(/lifestyle|leisure|home|furniture|decor/)) matchedIndustries.add('Lifestyle & Leisure');
        if (text.match(/health|pharma|medical|clinic|wellness/)) matchedIndustries.add('Healthcare & Pharma');
        if (text.match(/hotel|hospitality|travel|tourism|resort/)) matchedIndustries.add('Hospitality & Travel');
        if (text.match(/auto|car|mobility|vehicle|ev/)) matchedIndustries.add('Automotive & Mobility');
        if (text.match(/real estate|architecture|property|building/)) matchedIndustries.add('Real Estate & Architecture');
        if (text.match(/finance|fintech|bank|invest/)) matchedIndustries.add('Finance & Fintech');
        if (text.match(/fashion|apparel|clothing|shoes|accessories/)) matchedIndustries.add('Fashion & Apparel');
        if (text.match(/retail|ecommerce|shop|store/)) matchedIndustries.add('Retail & E-commerce');
        if (text.match(/culture|art|museum|gallery|exhibition/)) matchedIndustries.add('Culture & Arts');

        // Fallback for some basic mapping
        if (matchedServices.size === 0) matchedServices.add('Visual identity');
        if (matchedIndustries.size === 0) matchedIndustries.add('Lifestyle & Leisure'); // default

        const newTags = {
          services: Array.from(matchedServices),
          industries: Array.from(matchedIndustries)
        };

        const { error: updateErr } = await supabase.from('projects').update({
          category: JSON.stringify(newTags)
        }).eq('id', project.id);

        if (updateErr) {
          console.error(`Failed to update project ${project.title}:`, updateErr);
        } else {
          updatedCount++;
        }
      }

      toast.success(`Auto-tagged ${updatedCount} projects! (${skippedCount} skipped)`);
    } catch (err: any) {
      console.error('Auto-tagging error:', err);
      toast.error(err.message || 'Failed to auto-tag projects');
    } finally {
      setAutoTagging(false);
    }
  };

  const addCategory = () => {
    setCategories([...categories, { title_en: '', title_zh: '', items: [] }]);
  };

  const removeCategory = (index: number) => {
    if (confirm('Are you sure you want to remove this category?')) {
      const newCat = [...categories];
      newCat.splice(index, 1);
      setCategories(newCat);
    }
  };

  const updateCategory = (index: number, field: keyof ServiceCategory, value: string) => {
    const newCat = [...categories];
    newCat[index] = { ...newCat[index], [field]: value };
    setCategories(newCat);
  };

  const addItem = (catIndex: number) => {
    const newCat = [...categories];
    newCat[catIndex].items.push({ en: '', zh: '' });
    setCategories(newCat);
  };

  const removeItem = (catIndex: number, itemIndex: number) => {
    const newCat = [...categories];
    newCat[catIndex].items.splice(itemIndex, 1);
    setCategories(newCat);
  };

  const updateItem = (catIndex: number, itemIndex: number, field: keyof ServiceItem, value: string | boolean) => {
    const newCat = [...categories];
    newCat[catIndex].items[itemIndex] = { ...newCat[catIndex].items[itemIndex], [field]: value };
    setCategories(newCat);
  };

  const addIndustry = () => {
    setIndustries([...industries, { en: '', zh: '', showInFilter: true }]);
  };

  const removeIndustry = (index: number) => {
    const newInd = [...industries];
    newInd.splice(index, 1);
    setIndustries(newInd);
  };

  const updateIndustry = (index: number, field: keyof IndustryItem, value: string | boolean) => {
    const newInd = [...industries];
    newInd[index] = { ...newInd[index], [field]: value };
    setIndustries(newInd);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-black border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-500">Loading tags hierarchy...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <button 
          onClick={() => setIsServicesExpanded(!isServicesExpanded)}
          className="text-2xl font-bold uppercase tracking-tight flex items-center gap-2 hover:text-gray-600 transition-colors focus:outline-none"
        >
          {isServicesExpanded ? <ChevronDown size={24} /> : <ChevronRight size={24} />}
          <Tags size={24} /> Services & Tags Hierarchy
        </button>
        <div className="flex items-center gap-4">
          <button
            onClick={handleAutoTag}
            disabled={autoTagging}
            className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded font-medium hover:bg-purple-700 transition-colors disabled:opacity-50"
            title="Automatically analyze all existing projects and apply the new tags"
          >
            <Wand2 size={18} />
            {autoTagging ? 'Tagging...' : 'Auto-Tag All Projects'}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded font-medium hover:bg-gray-800 disabled:opacity-50"
          >
            <Save size={18} />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {isServicesExpanded && (
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500 mb-6">
            This controls the "SERVICES" accordion on the homepage and provides the predefined tags when editing projects.
          </p>
        
        <div className="space-y-8">
          {categories.map((cat, catIndex) => (
            <div key={catIndex} className="border border-gray-200 rounded-lg p-4 bg-gray-50 relative">
              <button 
                onClick={() => removeCategory(catIndex)}
                className="absolute top-4 right-4 text-red-500 hover:bg-red-50 p-2 rounded transition-colors"
                title="Remove Category"
              >
                <Trash2 size={18} />
              </button>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 pr-12">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Category Title (EN)</label>
                  <input 
                    type="text" 
                    value={cat.title_en}
                    onChange={(e) => updateCategory(catIndex, 'title_en', e.target.value)}
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-black outline-none"
                    placeholder="e.g. Brand Strategy"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Category Title (ZH)</label>
                  <input 
                    type="text" 
                    value={cat.title_zh}
                    onChange={(e) => updateCategory(catIndex, 'title_zh', e.target.value)}
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-black outline-none"
                    placeholder="e.g. 品牌战略"
                  />
                </div>
              </div>

              <div className="pl-4 border-l-2 border-gray-200 mt-6 space-y-3">
                <h4 className="text-sm font-bold text-gray-700 uppercase mb-3">Sub-Items (Tags)</h4>
                {cat.items.map((item, itemIndex) => (
                  <div key={itemIndex} className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer" title="Show in 'Everything' filter on homepage">
                      <input 
                        type="checkbox"
                        checked={item.showInFilter !== false}
                        onChange={(e) => updateItem(catIndex, itemIndex, 'showInFilter', e.target.checked)}
                        className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black cursor-pointer"
                      />
                    </label>
                    <input 
                      type="text" 
                      value={item.en}
                      onChange={(e) => updateItem(catIndex, itemIndex, 'en', e.target.value)}
                      className="flex-1 px-3 py-2 border rounded text-sm focus:ring-2 focus:ring-black outline-none"
                      placeholder="Tag Name (EN)"
                    />
                    <input 
                      type="text" 
                      value={item.zh}
                      onChange={(e) => updateItem(catIndex, itemIndex, 'zh', e.target.value)}
                      className="flex-1 px-3 py-2 border rounded text-sm focus:ring-2 focus:ring-black outline-none"
                      placeholder="Tag Name (ZH)"
                    />
                    <button 
                      onClick={() => removeItem(catIndex, itemIndex)}
                      className="text-gray-400 hover:text-red-500 p-2"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                
                <button 
                  onClick={() => addItem(catIndex)}
                  className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800 mt-2"
                >
                  <Plus size={16} /> Add Tag
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={addCategory}
          className="mt-6 w-full py-4 border-2 border-dashed border-gray-300 text-gray-500 rounded-lg flex items-center justify-center gap-2 hover:border-black hover:text-black transition-colors font-medium"
        >
          <Plus size={20} /> Add New Category
        </button>
      </div>
      )}

      <div className="bg-white rounded-lg shadow p-6 mt-8">
        <div className="flex items-center justify-between mb-2">
          <button 
            onClick={() => setIsIndustriesExpanded(!isIndustriesExpanded)}
            className="text-xl font-bold uppercase tracking-tight flex items-center gap-2 hover:text-gray-600 transition-colors focus:outline-none"
          >
            {isIndustriesExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
            Industries
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-6">
          Manage the industry tags used in projects and the homepage filter.
        </p>

        {isIndustriesExpanded && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {industries.map((industry, index) => (
            <div key={index} className="flex flex-col gap-2 p-4 border border-gray-200 rounded-lg bg-gray-50 relative">
              <button 
                onClick={() => removeIndustry(index)}
                className="absolute top-2 right-2 text-gray-400 hover:text-red-500 p-1"
              >
                <Trash2 size={16} />
              </button>
              
              <div className="mb-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-500 uppercase" title="Show in 'Everyone' filter on homepage">
                  <input 
                    type="checkbox"
                    checked={industry.showInFilter !== false}
                    onChange={(e) => updateIndustry(index, 'showInFilter', e.target.checked)}
                    className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black cursor-pointer"
                  />
                  Show in Filter
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">EN</label>
                <input 
                  type="text" 
                  value={industry.en}
                  onChange={(e) => updateIndustry(index, 'en', e.target.value)}
                  className="w-full px-3 py-2 border rounded text-sm focus:ring-2 focus:ring-black outline-none"
                  placeholder="e.g. FMCG"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">ZH</label>
                <input 
                  type="text" 
                  value={industry.zh}
                  onChange={(e) => updateIndustry(index, 'zh', e.target.value)}
                  className="w-full px-3 py-2 border rounded text-sm focus:ring-2 focus:ring-black outline-none"
                  placeholder="e.g. 快消品"
                />
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={addIndustry}
          className="mt-6 w-full py-4 border-2 border-dashed border-gray-300 text-gray-500 rounded-lg flex items-center justify-center gap-2 hover:border-black hover:text-black transition-colors font-medium"
        >
          <Plus size={20} /> Add New Industry
        </button>
        </>
        )}
      </div>
    </section>
  );
}
