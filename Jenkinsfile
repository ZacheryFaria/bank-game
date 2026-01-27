pipeline {
    agent any

    options {
        timestamps()
        timeout(time: 30, unit: 'MINUTES')
    }

    environment {
        BRANCH_TAG = env.BRANCH_NAME.replace('/', '__').replace('-', '_').toLowerCase()
        BUILD_TAG = "${env.BRANCH_TAG}_${env.GIT_COMMIT.substring(0, 8)}_${env.BUILD_NUMBER}"
        DOCKER_IMAGE = "bank-game-ci:${BUILD_TAG}"
    }

    stages {
        stage('Build Docker Image') {
            steps {
                script {
                    sh "docker build -t ${DOCKER_IMAGE} ."
                }
            }

            post {
                success {
                    publishChecks name: 'Build Docker Image',
                        summary: 'Docker image built successfully',
                        conclusion: 'SUCCESS',
                        detailsURL: "${env.BUILD_URL}console"
                }
                failure {
                    publishChecks name: 'Build Docker Image',
                        summary: 'Failed to build Docker image',
                        conclusion: 'FAILURE',
                        detailsURL: "${env.BUILD_URL}console"
                }
            }
        }

        stage('Parallel Tests') {
            parallel {
                stage('Backend Type Check') {
                    steps {
                        script {
                            sh "docker run --rm ${DOCKER_IMAGE} sh -c 'cd backend && pnpm type-check'"
                        }
                    }

                    post {
                        success {
                            publishChecks name: 'Backend Type Check',
                                summary: 'Backend TypeScript type checking passed',
                                conclusion: 'SUCCESS',
                                detailsURL: "${env.BUILD_URL}console"
                        }
                        failure {
                            publishChecks name: 'Backend Type Check',
                                summary: 'Backend TypeScript type checking failed',
                                conclusion: 'FAILURE',
                                detailsURL: "${env.BUILD_URL}console"
                        }
                    }
                }

                stage('Web Type Check') {
                    steps {
                        script {
                            sh "docker run --rm ${DOCKER_IMAGE} sh -c 'cd web && pnpm type-check'"
                        }
                    }

                    post {
                        success {
                            publishChecks name: 'Web Type Check',
                                summary: 'Web TypeScript type checking passed',
                                conclusion: 'SUCCESS',
                                detailsURL: "${env.BUILD_URL}console"
                        }
                        failure {
                            publishChecks name: 'Web Type Check',
                                summary: 'Web TypeScript type checking failed',
                                conclusion: 'FAILURE',
                                detailsURL: "${env.BUILD_URL}console"
                        }
                    }
                }

                stage('Shared Type Check') {
                    steps {
                        script {
                            sh "docker run --rm ${DOCKER_IMAGE} sh -c 'cd packages/shared && pnpm type-check'"
                        }
                    }

                    post {
                        success {
                            publishChecks name: 'Shared Type Check',
                                summary: 'Shared package TypeScript type checking passed',
                                conclusion: 'SUCCESS',
                                detailsURL: "${env.BUILD_URL}console"
                        }
                        failure {
                            publishChecks name: 'Shared Type Check',
                                summary: 'Shared package TypeScript type checking failed',
                                conclusion: 'FAILURE',
                                detailsURL: "${env.BUILD_URL}console"
                        }
                    }
                }

                stage('Backend Build') {
                    steps {
                        script {
                            sh "docker run --rm ${DOCKER_IMAGE} sh -c 'cd backend && pnpm build'"
                        }
                    }

                    post {
                        success {
                            publishChecks name: 'Backend Build',
                                summary: 'Backend built successfully',
                                conclusion: 'SUCCESS',
                                detailsURL: "${env.BUILD_URL}console"
                        }
                        failure {
                            publishChecks name: 'Backend Build',
                                summary: 'Backend build failed',
                                conclusion: 'FAILURE',
                                detailsURL: "${env.BUILD_URL}console"
                        }
                    }
                }

                stage('Web Build') {
                    steps {
                        script {
                            sh "docker run --rm ${DOCKER_IMAGE} sh -c 'cd web && pnpm build'"
                        }
                    }

                    post {
                        success {
                            publishChecks name: 'Web Build',
                                summary: 'Web built successfully',
                                conclusion: 'SUCCESS',
                                detailsURL: "${env.BUILD_URL}console"
                        }
                        failure {
                            publishChecks name: 'Web Build',
                                summary: 'Web build failed',
                                conclusion: 'FAILURE',
                                detailsURL: "${env.BUILD_URL}console"
                        }
                    }
                }

                stage('Backend Lint') {
                    steps {
                        script {
                            sh "docker run --rm ${DOCKER_IMAGE} sh -c 'cd backend && pnpm lint' || true"
                        }
                    }

                    post {
                        always {
                            publishChecks name: 'Backend Lint',
                                summary: 'Backend linting completed (non-blocking until backend-dev-ia2 resolved)',
                                conclusion: 'NEUTRAL',
                                detailsURL: "${env.BUILD_URL}console"
                        }
                    }
                }

                stage('Web Lint') {
                    steps {
                        script {
                            sh "docker run --rm ${DOCKER_IMAGE} sh -c 'cd web && pnpm lint' || true"
                        }
                    }

                    post {
                        always {
                            publishChecks name: 'Web Lint',
                                summary: 'Web linting completed (non-blocking until backend-dev-ia2 resolved)',
                                conclusion: 'NEUTRAL',
                                detailsURL: "${env.BUILD_URL}console"
                        }
                    }
                }

                stage('Web Tests') {
                    when {
                        expression {
                            return sh(
                                script: "docker run --rm ${DOCKER_IMAGE} sh -c 'cd web && find src -name \"*.test.tsx\" 2>/dev/null | wc -l'",
                                returnStdout: true
                            ).trim().toInteger() > 0
                        }
                    }
                    steps {
                        script {
                            sh """
                                docker run --rm -v \$(pwd)/artifacts:/artifacts ${DOCKER_IMAGE} sh -c '
                                    cd web &&
                                    pnpm test &&
                                    mkdir -p /artifacts/web &&
                                    cp -r test-results /artifacts/web/
                                '
                            """
                        }
                    }

                    post {
                        always {
                            junit testResults: 'artifacts/web/test-results/junit.xml', allowEmptyResults: true
                            sh "docker run --rm -v \$(pwd)/artifacts:/artifacts ${DOCKER_IMAGE} rm -rf /artifacts/web"
                        }
                        success {
                            publishChecks name: 'Web Tests',
                                summary: 'Web tests passed',
                                conclusion: 'SUCCESS',
                                detailsURL: "${env.BUILD_URL}console"
                        }
                        failure {
                            publishChecks name: 'Web Tests',
                                summary: 'Web tests failed',
                                conclusion: 'FAILURE',
                                detailsURL: "${env.BUILD_URL}console"
                        }
                    }
                }

                stage('Backend Tests') {
                    when {
                        expression {
                            return sh(
                                script: "docker run --rm ${DOCKER_IMAGE} sh -c 'cd backend && find src -name \"*.test.ts\" 2>/dev/null | wc -l'",
                                returnStdout: true
                            ).trim().toInteger() > 0
                        }
                    }
                    steps {
                        script {
                            sh """
                                # Create test database network
                                docker network create ${BUILD_TAG}-test-net || true

                                # Start PostgreSQL container for tests
                                docker run -d \
                                    --name ${BUILD_TAG}-test-db \
                                    --network ${BUILD_TAG}-test-net \
                                    -e POSTGRES_USER=postgres \
                                    -e POSTGRES_PASSWORD=postgres \
                                    -e POSTGRES_DB=bank_game_test \
                                    postgres:18

                                # Wait for PostgreSQL to be ready
                                sleep 5
                                docker exec ${BUILD_TAG}-test-db pg_isready -U postgres || sleep 5

                                # Run migrations on test database
                                docker run --rm \
                                    --network ${BUILD_TAG}-test-net \
                                    -e DATABASE_URL=postgresql://postgres:postgres@${BUILD_TAG}-test-db:5432/bank_game_test \
                                    ${DOCKER_IMAGE} sh -c 'cd backend && pnpm prisma migrate deploy'

                                # Run backend tests
                                docker run --rm \
                                    --network ${BUILD_TAG}-test-net \
                                    -e DATABASE_URL=postgresql://postgres:postgres@${BUILD_TAG}-test-db:5432/bank_game_test \
                                    -v \$(pwd)/artifacts:/artifacts \
                                    ${DOCKER_IMAGE} sh -c 'cd backend && pnpm test && mkdir -p /artifacts/backend && cp -r test-results /artifacts/backend/'
                            """
                        }
                    }

                    post {
                        always {
                            junit testResults: 'artifacts/backend/test-results/junit.xml', allowEmptyResults: true
                            sh """
                                docker stop ${BUILD_TAG}-test-db || true
                                docker rm ${BUILD_TAG}-test-db || true
                                docker network rm ${BUILD_TAG}-test-net || true
                                docker run --rm -v \$(pwd)/artifacts:/artifacts ${DOCKER_IMAGE} rm -rf /artifacts/backend || true
                            """
                        }
                        success {
                            publishChecks name: 'Backend Tests',
                                summary: 'Backend tests passed',
                                conclusion: 'SUCCESS',
                                detailsURL: "${env.BUILD_URL}console"
                        }
                        failure {
                            publishChecks name: 'Backend Tests',
                                summary: 'Backend tests failed',
                                conclusion: 'FAILURE',
                                detailsURL: "${env.BUILD_URL}console"
                        }
                    }
                }
            }
        }

        stage('Docker Disk Usage Report') {
            steps {
                script {
                    sh """
                        echo "=== Docker Disk Usage ==="
                        docker system df
                        echo ""
                        echo "=== Docker Images ==="
                        docker images --format "table {{.Repository}}\\t{{.Tag}}\\t{{.Size}}" | head -10
                    """
                }
            }
        }

        stage('Cleanup Docker Image') {
            steps {
                script {
                    sh "docker rmi ${DOCKER_IMAGE} || true"
                }
            }
        }
    }

    post {
        always {
            cleanWs()
        }
        success {
            script {
                def duration = currentBuild.durationString.replace(' and counting', '')
                echo """
                ✅ BUILD SUCCEEDED
                ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                Duration: ${duration}
                Branch: ${env.BRANCH_NAME}
                Commit: ${env.GIT_COMMIT[0..7]}
                Image: ${DOCKER_IMAGE}
                Build URL: ${env.BUILD_URL}
                ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                """
            }
        }
        failure {
            script {
                def duration = currentBuild.durationString.replace(' and counting', '')
                echo """
                ❌ BUILD FAILED
                ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                Duration: ${duration}
                Branch: ${env.BRANCH_NAME}
                Commit: ${env.GIT_COMMIT[0..7]}
                Image: ${DOCKER_IMAGE}
                Console: ${env.BUILD_URL}console
                ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                """
            }
        }
    }
}
