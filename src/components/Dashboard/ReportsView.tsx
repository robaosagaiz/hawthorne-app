import React, { useEffect, useState } from 'react';
import { fetchReportsFromApi, type Report } from '../../services/apiService';
import { FileText, Calendar, Flame, Beef, Wheat, Droplet, ChevronDown, ChevronUp, Lightbulb, TrendingUp, AlertCircle } from 'lucide-react';

interface ReportsViewProps {
    grupoId: string;
    protocolSince?: string;
    protocolUntil?: string;
}

const ReportsView: React.FC<ReportsViewProps> = ({ grupoId, protocolSince, protocolUntil }) => {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedReport, setExpandedReport] = useState<string | null>(null);

    useEffect(() => {
        const loadReports = async () => {
            setLoading(true);
            const data = await fetchReportsFromApi(grupoId, protocolSince, protocolUntil);
            // Sort by date descending (most recent first)
            const sorted = data.sort((a, b) => {
                const dateA = a.dateTime || a.date;
                const dateB = b.dateTime || b.date;
                return dateB.localeCompare(dateA);
            });
            setReports(sorted);
            setLoading(false);
        };
        loadReports();
    }, [grupoId, protocolSince, protocolUntil]);

    const toggleExpand = (reportId: string) => {
        setExpandedReport(expandedReport === reportId ? null : reportId);
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return 'Data não informada';
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('pt-BR', { 
                day: '2-digit', 
                month: 'short', 
                year: 'numeric' 
            });
        } catch {
            return dateStr;
        }
    };

    if (loading) {
        return (
            <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Carregando relatórios...</p>
            </div>
        );
    }

    if (reports.length === 0) {
        return (
            <div className="p-8 text-center text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum relatório encontrado para este paciente.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-700 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-teal-600" />
                    Relatórios Nutricionais
                </h3>
                <span className="text-sm text-gray-500">{reports.length} relatórios</span>
            </div>

            {reports.map((report) => (
                <div 
                    key={report.id} 
                    className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow"
                >
                    {/* Header - Always visible */}
                    <button
                        onClick={() => toggleExpand(report.id)}
                        className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-teal-100 to-teal-200 flex items-center justify-center">
                                <Calendar className="w-6 h-6 text-teal-600" />
                            </div>
                            <div className="text-left">
                                <p className="font-semibold text-gray-800">{formatDate(report.dateTime || report.date)}</p>
                                <p className="text-sm text-gray-500">Ref: {report.date}</p>
                            </div>
                        </div>

                        {/* Macro Summary */}
                        <div className="hidden md:flex items-center gap-6 text-sm">
                            <div className="flex items-center gap-1 text-orange-600">
                                <Flame size={14} />
                                <span>{report.energy} kcal</span>
                            </div>
                            <div className="flex items-center gap-1 text-red-600">
                                <Beef size={14} />
                                <span>{report.protein}g</span>
                            </div>
                            <div className="flex items-center gap-1 text-amber-600">
                                <Wheat size={14} />
                                <span>{report.carbs}g</span>
                            </div>
                            <div className="flex items-center gap-1 text-blue-600">
                                <Droplet size={14} />
                                <span>{report.fats}g</span>
                            </div>
                        </div>

                        {expandedReport === report.id ? (
                            <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                    </button>

                    {/* Expanded Content */}
                    {expandedReport === report.id && (
                        <div className="border-t border-gray-100 p-4 space-y-4 bg-gray-50">
                            {/* Mobile Macro Summary */}
                            <div className="md:hidden flex flex-wrap gap-4 text-sm pb-4 border-b border-gray-200">
                                <div className="flex items-center gap-1 text-orange-600">
                                    <Flame size={14} />
                                    <span>{report.energy} kcal</span>
                                </div>
                                <div className="flex items-center gap-1 text-red-600">
                                    <Beef size={14} />
                                    <span>{report.protein}g prot</span>
                                </div>
                                <div className="flex items-center gap-1 text-amber-600">
                                    <Wheat size={14} />
                                    <span>{report.carbs}g carb</span>
                                </div>
                                <div className="flex items-center gap-1 text-blue-600">
                                    <Droplet size={14} />
                                    <span>{report.fats}g gord</span>
                                </div>
                            </div>

                            {/* Micronutrients Analysis */}
                            {report.micronutrients && (
                                <div className="bg-white p-4 rounded-lg border border-gray-200">
                                    <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4 text-purple-500" />
                                        Análise de Micronutrientes
                                    </h4>
                                    <p className="text-sm text-gray-600 leading-relaxed">{report.micronutrients}</p>
                                </div>
                            )}

                            {/* Consolidation */}
                            {report.consolidation && (
                                <div className="bg-white p-4 rounded-lg border border-gray-200">
                                    <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4 text-blue-500" />
                                        Consolidação
                                    </h4>
                                    <p className="text-sm text-gray-600 leading-relaxed">{report.consolidation}</p>
                                </div>
                            )}

                            {/* Daily Guidance */}
                            {report.dailyGuidance && (
                                <div className="bg-teal-50 p-4 rounded-lg border border-teal-200">
                                    <h4 className="font-semibold text-teal-700 mb-2 flex items-center gap-2">
                                        <Lightbulb className="w-4 h-4 text-teal-500" />
                                        Orientações do Dia
                                    </h4>
                                    <div className="text-sm text-teal-800 leading-relaxed whitespace-pre-line">
                                        {report.dailyGuidance}
                                    </div>
                                </div>
                            )}

                            {/* Overview/Panorama */}
                            {report.overview && (
                                <div className="bg-white p-4 rounded-lg border border-gray-200">
                                    <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-gray-500" />
                                        Panorama Geral
                                    </h4>
                                    <p className="text-sm text-gray-600 leading-relaxed">{report.overview}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default ReportsView;
