pipeline {
    agent any

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

                stage('TUI Type Check') {
                    steps {
                        script {
                            sh "docker run --rm ${DOCKER_IMAGE} sh -c 'cd tui && pnpm type-check'"
                        }
                    }

                    post {
                        success {
                            publishChecks name: 'TUI Type Check',
                                summary: 'TUI TypeScript type checking passed',
                                conclusion: 'SUCCESS',
                                detailsURL: "${env.BUILD_URL}console"
                        }
                        failure {
                            publishChecks name: 'TUI Type Check',
                                summary: 'TUI TypeScript type checking failed',
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

                stage('TUI Build') {
                    steps {
                        script {
                            sh "docker run --rm ${DOCKER_IMAGE} sh -c 'cd tui && pnpm build'"
                        }
                    }

                    post {
                        success {
                            publishChecks name: 'TUI Build',
                                summary: 'TUI built successfully',
                                conclusion: 'SUCCESS',
                                detailsURL: "${env.BUILD_URL}console"
                        }
                        failure {
                            publishChecks name: 'TUI Build',
                                summary: 'TUI build failed',
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
                                summary: 'Backend linting completed (warnings allowed)',
                                conclusion: 'NEUTRAL',
                                detailsURL: "${env.BUILD_URL}console"
                        }
                    }
                }

                stage('TUI Lint') {
                    steps {
                        script {
                            sh "docker run --rm ${DOCKER_IMAGE} sh -c 'cd tui && pnpm lint' || true"
                        }
                    }

                    post {
                        always {
                            publishChecks name: 'TUI Lint',
                                summary: 'TUI linting completed (warnings allowed)',
                                conclusion: 'NEUTRAL',
                                detailsURL: "${env.BUILD_URL}console"
                        }
                    }
                }

                stage('TUI Tests') {
                    when {
                        expression {
                            return sh(
                                script: "docker run --rm ${DOCKER_IMAGE} sh -c 'cd tui && find src -name \"*.test.tsx\" 2>/dev/null | wc -l'",
                                returnStdout: true
                            ).trim().toInteger() > 0
                        }
                    }
                    steps {
                        script {
                            sh """
                                docker run --rm -v \$(pwd)/artifacts:/artifacts ${DOCKER_IMAGE} sh -c '
                                    cd tui &&
                                    pnpm test &&
                                    mkdir -p /artifacts/tui &&
                                    cp -r test-results /artifacts/tui/
                                '
                            """
                        }
                    }

                    post {
                        always {
                            junit testResults: 'artifacts/tui/test-results/junit.xml', allowEmptyResults: true
                            sh "docker run --rm -v \$(pwd)/artifacts:/artifacts ${DOCKER_IMAGE} rm -rf /artifacts/tui"
                        }
                        success {
                            publishChecks name: 'TUI Tests',
                                summary: 'TUI tests passed',
                                conclusion: 'SUCCESS',
                                detailsURL: "${env.BUILD_URL}console"
                        }
                        failure {
                            publishChecks name: 'TUI Tests',
                                summary: 'TUI tests failed',
                                conclusion: 'FAILURE',
                                detailsURL: "${env.BUILD_URL}console"
                        }
                    }
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

                        # Push schema to test database
                        docker run --rm \
                            --network ${BUILD_TAG}-test-net \
                            -e DATABASE_URL=postgresql://postgres:postgres@${BUILD_TAG}-test-db:5432/bank_game_test \
                            ${DOCKER_IMAGE} sh -c 'cd backend && pnpm prisma db push --skip-generate --accept-data-loss'

                        # Run backend tests
                        docker run --rm \
                            --network ${BUILD_TAG}-test-net \
                            -e TEST_DATABASE_URL=postgresql://postgres:postgres@${BUILD_TAG}-test-db:5432/bank_game_test \
                            ${DOCKER_IMAGE} sh -c 'cd backend && pnpm test'
                    """
                }
            }

            post {
                always {
                    sh """
                        docker stop ${BUILD_TAG}-test-db || true
                        docker rm ${BUILD_TAG}-test-db || true
                        docker network rm ${BUILD_TAG}-test-net || true
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
    }
}
