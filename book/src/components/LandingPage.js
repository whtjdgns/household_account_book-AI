import React, { useEffect } from 'react';

function LandingPage({ onNavigateToAuth }) {

    useEffect(() => {
        const smoothScrollLinks = document.querySelectorAll('a[href^="#"]');
        const handleSmoothScroll = function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth' });
            }
        };
        smoothScrollLinks.forEach(anchor => {
            anchor.addEventListener('click', handleSmoothScroll);
        });

        const header = document.getElementById('main-header');
        const handleScroll = () => {
            if (header && window.scrollY > 10) {
                header.classList.add('bg-white', 'shadow-md');
            } else if (header) {
                header.classList.remove('bg-white', 'shadow-md');
            }
        };
        window.addEventListener('scroll', handleScroll, { passive: true });

        const sections = document.querySelectorAll('.section-fade-in');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        sections.forEach(section => {
            observer.observe(section);
        });

        return () => {
            window.removeEventListener('scroll', handleScroll);
            smoothScrollLinks.forEach(anchor => {
                anchor.removeEventListener('click', handleSmoothScroll);
            });
            sections.forEach(section => {
                if (section) observer.unobserve(section);
            });
        };
    }, []);

    return (
        <div id="landing-page" className="bg-white">
            <style>{`
                .section-fade-in {
                    opacity: 0;
                    transform: translateY(20px);
                    transition: opacity 0.6s ease-out, transform 0.6s ease-out;
                }
                .section-fade-in.visible {
                    opacity: 1;
                    transform: translateY(0);
                }
            `}</style>
            <header id="main-header" className="sticky top-0 z-50 transition-all duration-300">
                <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="text-2xl font-bold text-violet-600">핀로그</div>
                    <div className="hidden md:flex items-center space-x-8">
                        <a href="#features" className="text-gray-600 hover:text-violet-600 font-medium">핵심 기능</a>
                        <a href="#how-it-works" className="text-gray-600 hover:text-violet-600 font-medium">작동 방식</a>
                        <button onClick={onNavigateToAuth} className="cta-btn bg-violet-600 text-white font-medium py-2 px-6 rounded-full hover:bg-violet-700 transition-colors duration-300">로그인</button>
                    </div>
                    <div className="md:hidden">
                        <button onClick={onNavigateToAuth} className="cta-btn bg-violet-600 text-white font-medium py-2 px-4 rounded-full hover:bg-violet-700 transition-colors duration-300">로그인</button>
                    </div>
                </nav>
            </header>
            <main>
                <section className="text-center pt-24 pb-28 px-6 bg-white">
                    <div className="container mx-auto">
                        <div className="grid md:grid-cols-2 gap-12 items-center">
                            <div className="text-left">
                                <h1 className="text-4xl md:text-5xl font-black mb-6 text-gray-900 leading-tight">
                                    스마트한 자산 관리,<br/>AI와 함께 쉽고 간편하게
                                </h1>
                                <p className="text-lg md:text-xl text-gray-600 max-w-lg mb-10">
                                    AI가 당신의 소비 패턴을 분석하고, 현명한 금융 결정을 내릴 수 있도록 돕습니다. 복잡한 가계부 앱은 이제 그만, 핀로그로 시작하세요.
                                </p>
                                <button onClick={onNavigateToAuth} className="cta-btn bg-violet-600 text-white font-bold py-4 px-10 rounded-full text-lg hover:bg-violet-700 transition-transform duration-300 transform hover:scale-105 inline-block shadow-lg shadow-violet-500/30">
                                    지금 바로 경험하기
                                </button>
                            </div>
                            <div className="hidden md:block p-8 bg-slate-100 rounded-2xl shadow-lg">
                                <div className="bg-white rounded-xl p-6 shadow-inner">
                                    <div className="flex items-center mb-6">
                                        <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                                        <span className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
                                        <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 text-left mb-6">
                                        <div className="bg-green-50 p-3 rounded-lg">
                                            <p className="text-sm text-green-700">총 수입</p>
                                            <p className="font-bold text-lg text-green-800">+₩3,000,000</p>
                                        </div>
                                        <div className="bg-red-50 p-3 rounded-lg">
                                            <p className="text-sm text-red-700">총 지출</p>
                                            <p className="font-bold text-lg text-red-800">-₩1,250,000</p>
                                        </div>
                                    </div>
                                    <p className="text-left text-sm font-medium text-gray-600 mb-4">카테고리별 지출</p>
                                    <div className="flex items-center justify-center">
                                        <svg width="150" height="150" viewBox="0 0 36 36" className="transform -rotate-90">
                                            <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#e6e6e6" strokeWidth="3"></circle>
                                            <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#8b5cf6" strokeWidth="3" strokeDasharray="60, 100"></circle>
                                            <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#3b82f6" strokeWidth="3" strokeDasharray="25, 100" strokeDashoffset="-60"></circle>
                                            <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#f59e0b" strokeWidth="3" strokeDasharray="15, 100" strokeDashoffset="-85"></circle>
                                        </svg>
                                        <div className="ml-6 text-left text-sm space-y-2">
                                            <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-violet-500 mr-2"></span><span>식비: 60%</span></div>
                                            <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-blue-500 mr-2"></span><span>교통: 25%</span></div>
                                            <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-amber-500 mr-2"></span><span>쇼핑: 15%</span></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
                
                <section id="how-it-works" className="py-20 bg-slate-50 section-fade-in">
                     <div className="container mx-auto px-6">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-4xl font-bold">단 3단계면 충분합니다</h2>
                            <p className="text-lg text-gray-500 mt-2">핀로그는 이렇게 작동해요.</p>
                        </div>
                        <div className="relative">
                            <div className="hidden md:block absolute top-1/2 left-0 w-full h-px bg-gray-300 border-t-2 border-dashed -translate-y-1/2"></div>
                            <div className="grid md:grid-cols-3 gap-12 relative">
                                <div className="text-center">
                                    <div className="flex items-center justify-center w-20 h-20 mx-auto mb-6 bg-violet-100 text-violet-600 rounded-full text-2xl font-bold border-4 border-white shadow-lg">1</div>
                                    <h3 className="text-xl font-bold mb-2">손쉬운 기록</h3>
                                    <p className="text-gray-600">거래 내역이 생길 때마다 AI 챗봇에게 말하거나, 간단히 입력하여 기록을 남기세요.</p>
                                </div>
                                <div className="text-center">
                                    <div className="flex items-center justify-center w-20 h-20 mx-auto mb-6 bg-violet-100 text-violet-600 rounded-full text-2xl font-bold border-4 border-white shadow-lg">2</div>
                                    <h3 className="text-xl font-bold mb-2">자동 분석</h3>
                                    <p className="text-gray-600">AI가 실시간으로 데이터를 분석하여 카테고리를 분류하고, 대시보드에 보기 쉽게 정리해 드립니다.</p>
                                </div>
                                <div className="text-center">
                                    <div className="flex items-center justify-center w-20 h-20 mx-auto mb-6 bg-violet-100 text-violet-600 rounded-full text-2xl font-bold border-4 border-white shadow-lg">3</div>
                                    <h3 className="text-xl font-bold mb-2">현명한 절약</h3>
                                    <p className="text-gray-600">분석된 소비 패턴을 바탕으로 제공되는 맞춤형 절약 팁을 통해 더 나은 금융 습관을 만드세요.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section id="features" className="py-20 bg-white section-fade-in">
                    <div className="container mx-auto px-6">
                        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">당신의 금융 비서가 하는 일</h2>
                        <div className="grid md:grid-cols-3 gap-8">
                            <div className="text-center p-8 bg-slate-50 rounded-2xl hover:shadow-xl transition-shadow duration-300">
                                <div className="text-4xl text-violet-500 mb-4">🤖</div>
                                <h3 className="text-xl font-bold mb-2">AI 자동 분류</h3>
                                <p className="text-gray-600">지출 내역을 입력하면 AI가 '식비', '교통비' 등 적절한 카테고리를 자동으로 추천해줍니다.</p>
                            </div>
                            <div className="text-center p-8 bg-slate-50 rounded-2xl hover:shadow-xl transition-shadow duration-300">
                                <div className="text-4xl text-violet-500 mb-4">📊</div>
                                <h3 className="text-xl font-bold mb-2">대시보드 요약</h3>
                                <p className="text-gray-600">현재 잔액, 이번 달 수입과 지출, 예산 대비 사용량을 한눈에 파악할 수 있습니다.</p>
                            </div>
                            <div className="text-center p-8 bg-slate-50 rounded-2xl hover:shadow-xl transition-shadow duration-300">
                                <div className="text-4xl text-violet-500 mb-4">💡</div>
                                <h3 className="text-xl font-bold mb-2">소비 패턴 분석</h3>
                                <p className="text-gray-600">AI가 당신의 지출을 분석하여 소비 습관에 대한 인사이트와 맞춤형 절약 팁을 제공합니다.</p>
                            </div>
                        </div>
                    </div>
                </section>
                
                <section id="cta" className="bg-violet-600 text-white text-center py-20 px-6 section-fade-in">
                    <div className="container mx-auto">
                        <h2 className="text-3xl md:text-4xl font-bold mb-6">당신의 금융 비서, 지금 바로 만나보세요.</h2>
                        <button onClick={onNavigateToAuth} className="cta-btn bg-white text-violet-600 font-bold py-4 px-10 rounded-full text-lg hover:bg-slate-100 transition-transform duration-300 transform hover:scale-105 inline-block">
                            지금 바로 시작하기
                        </button>
                    </div>
                </section>
            </main>
            <footer className="bg-gray-800 text-gray-400 text-center py-6 mt-auto">
                <div className="container mx-auto">
                    <p>© 2025 Fin Log. All Rights Reserved.</p>
                </div>
            </footer>
        </div>
    );
}

export default LandingPage;