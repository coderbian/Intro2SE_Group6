"use client"

import { useState } from "react"
import { Button } from "../ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"
import { Input } from "../ui/input"
import { Skeleton } from "../ui/skeleton"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog"
import { Search, FolderKanban, Users, Calendar, SendHorizontal, CheckCircle2, Compass } from "lucide-react"
import { useProjectDiscovery, type DiscoverableProject } from "../../hooks"

export function ProjectDiscovery() {
    const {
        projects,
        loading,
        error,
        searchQuery,
        setSearchQuery,
        requestToJoin,
    } = useProjectDiscovery();

    const [selectedProject, setSelectedProject] = useState<DiscoverableProject | null>(null);
    const [joiningProjectId, setJoiningProjectId] = useState<string | null>(null);

    const handleRequestToJoin = async (projectId: string, e?: React.MouseEvent) => {
        if (e) {
            e.stopPropagation();
        }

        setJoiningProjectId(projectId);
        await requestToJoin(projectId);
        setJoiningProjectId(null);
    };

    // Loading skeleton
    const LoadingSkeleton = () => (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
                <Card key={i}>
                    <CardHeader>
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-full mt-2" />
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <Skeleton className="h-4 w-1/2" />
                            <Skeleton className="h-4 w-2/3" />
                            <Skeleton className="h-9 w-full" />
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );

    // Empty state
    const EmptyState = () => (
        <Card>
            <CardContent className="py-12 text-center">
                <FolderKanban className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-600">
                    {searchQuery
                        ? "Không tìm thấy dự án phù hợp"
                        : "Chưa có dự án công khai nào để khám phá"}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                    Thử tìm kiếm với từ khóa khác
                </p>
            </CardContent>
        </Card>
    );

    // Project card component
    const ProjectCard = ({ project }: { project: DiscoverableProject }) => {
        const isJoining = joiningProjectId === project.id;

        return (
            <Card
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setSelectedProject(project)}
            >
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg truncate">{project.name}</CardTitle>
                            <CardDescription className="line-clamp-2 mt-1">
                                {project.description || "Không có mô tả"}
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Users className="w-4 h-4 flex-shrink-0" />
                            <span>{project.member_count} thành viên</span>
                        </div>
                        {project.deadline && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Calendar className="w-4 h-4 flex-shrink-0" />
                                <span>Deadline: {new Date(project.deadline).toLocaleDateString("vi-VN")}</span>
                            </div>
                        )}

                        {project.has_requested ? (
                            <Button
                                variant="secondary"
                                className="w-full"
                                disabled
                                onClick={(e) => e.stopPropagation()}
                            >
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                Đã gửi yêu cầu
                            </Button>
                        ) : (
                            <Button
                                className="w-full"
                                onClick={(e) => handleRequestToJoin(project.id, e)}
                                disabled={isJoining}
                            >
                                {isJoining ? (
                                    <>Đang gửi...</>
                                ) : (
                                    <>
                                        <SendHorizontal className="w-4 h-4 mr-2" />
                                        Yêu cầu tham gia
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        );
    };

    return (
        <div className="container mx-auto px-4 py-6 max-w-6xl">
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                    <Compass className="w-6 h-6 text-blue-600" />
                    <h1 className="text-2xl font-bold">Khám phá dự án</h1>
                </div>
                <p className="text-gray-600 text-sm">
                    Tìm kiếm và tham gia các dự án công khai
                </p>
            </div>

            {/* Search Bar */}
            <div className="mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <Input
                        placeholder="Tìm kiếm dự án theo tên hoặc mô tả..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            {/* Error State */}
            {error && (
                <Card className="mb-4 border-red-200 bg-red-50">
                    <CardContent className="py-4">
                        <p className="text-red-600 text-sm">{error}</p>
                    </CardContent>
                </Card>
            )}

            {/* Content */}
            {loading ? (
                <LoadingSkeleton />
            ) : projects.length === 0 ? (
                <EmptyState />
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {projects.map((project) => (
                        <ProjectCard key={project.id} project={project} />
                    ))}
                </div>
            )}

            {/* Project Detail Modal */}
            {selectedProject && (
                <Dialog open={!!selectedProject} onOpenChange={() => setSelectedProject(null)}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>{selectedProject.name}</DialogTitle>
                            <DialogDescription>
                                {selectedProject.description || "Không có mô tả"}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                            <div>
                                <h4 className="font-semibold text-sm mb-2">Thông tin dự án</h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Số thành viên:</span>
                                        <Badge variant="secondary">{selectedProject.member_count}</Badge>
                                    </div>
                                    {selectedProject.deadline && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600">Deadline:</span>
                                            <span>{new Date(selectedProject.deadline).toLocaleDateString("vi-VN")}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-2 pt-4 border-t">
                                {selectedProject.has_requested ? (
                                    <Button variant="secondary" className="flex-1" disabled>
                                        <CheckCircle2 className="w-4 h-4 mr-2" />
                                        Đã gửi yêu cầu
                                    </Button>
                                ) : (
                                    <Button
                                        className="flex-1"
                                        onClick={() => {
                                            handleRequestToJoin(selectedProject.id);
                                            // Update modal state locally
                                            setSelectedProject((prev) =>
                                                prev ? { ...prev, has_requested: true } : null
                                            );
                                        }}
                                        disabled={joiningProjectId === selectedProject.id}
                                    >
                                        {joiningProjectId === selectedProject.id ? (
                                            <>Đang gửi...</>
                                        ) : (
                                            <>
                                                <SendHorizontal className="w-4 h-4 mr-2" />
                                                Yêu cầu tham gia
                                            </>
                                        )}
                                    </Button>
                                )}
                                <Button variant="outline" onClick={() => setSelectedProject(null)} className="flex-1">
                                    Đóng
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
